"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getAudiobooks,
  saveAudiobooks,
  type Audiobook,
} from "./storage";

const LOCAL_API_URL = "http://127.0.0.1:8000";

const PUBLIC_API_URL =
  "https://rafta-ai-audiobook-converter.onrender.com";

const ACTIVE_JOB_KEY =
  "rafta_background_generation";

const STATUS_KEY =
  "rafta_background_generation_status";

const START_EVENT =
  "rafta-start-background-generation";

const STATUS_EVENT =
  "rafta-background-generation-status";

type ChapterStatus = {
  id?: string;
  number: number;
  title: string;
  status:
    | "queued"
    | "processing"
    | "completed"
    | "error";
  audio_url?: string;
  error?: string;
};

type BookJobResponse = {
  job_id: string;
  book_title: string;
  status: string;
  total: number;
  completed: number;
  errors: number;
  chapters: ChapterStatus[];
};

type ActiveBookJob = {
  type: "book";
  jobId: string;
  bookTitle: string;
  voice: string;
  totalChapters: number;
  startedAt: string;
};

export type BackgroundGenerationStatus = {
  active: boolean;
  type: "book" | "single" | null;
  title: string;
  completed: number;
  total: number;
  message: string;
  audioUrl?: string;
  error?: boolean;
};

const DEFAULT_STATUS: BackgroundGenerationStatus = {
  active: false,
  type: null,
  title: "",
  completed: 0,
  total: 0,
  message: "",
  audioUrl: "",
  error: false,
};

const getApiUrl = () => {
  if (typeof window === "undefined") {
    return PUBLIC_API_URL;
  }

  const configured =
    process.env.NEXT_PUBLIC_API_URL?.replace(
      /\/+$/,
      ""
    );

  if (configured) {
    return configured;
  }

  return window.location.hostname ===
    "localhost" ||
    window.location.hostname ===
      "127.0.0.1"
    ? LOCAL_API_URL
    : PUBLIC_API_URL;
};

const normalizeAudioUrl = (
  url: string,
  apiUrl: string
) => {
  if (!url) {
    return "";
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${apiUrl}${url}`;
  }

  return `${apiUrl}/${url}`;
};

const saveCompletedChapterAudio = (
  jobId: string,
  bookTitle: string,
  voice: string,
  chapters: ChapterStatus[],
  apiUrl: string
) => {
  const completed = chapters.filter(
    (chapter) =>
      chapter.status === "completed" &&
      typeof chapter.audio_url === "string" &&
      chapter.audio_url.trim()
  );

  if (completed.length === 0) {
    return;
  }

  const existing = getAudiobooks();

  const existingIds = new Set(
    existing.map((book) => book.id)
  );

  const newAudiobooks: Audiobook[] = [];

  for (const chapter of completed) {
    const id =
      `${jobId}-chapter-${chapter.number}`;

    if (existingIds.has(id)) {
      continue;
    }

    newAudiobooks.push({
      id,
      title:
        `${bookTitle} — ${chapter.title}`,
      voice,
      audioUrl: normalizeAudioUrl(
        chapter.audio_url || "",
        apiUrl
      ),
      createdAt:
        new Date().toISOString(),
      bookId: jobId,
      bookTitle,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      status: "completed",
    });
  }

  if (newAudiobooks.length === 0) {
    return;
  }

  saveAudiobooks([
    ...newAudiobooks,
    ...existing,
  ]);

  window.dispatchEvent(
    new Event(
      "rafta-audiobooks-updated"
    )
  );
};

export default function BackgroundGenerationManager() {
  const [status, setStatus] =
    useState<BackgroundGenerationStatus>(
      DEFAULT_STATUS
    );

  const runningRef =
    useRef(false);

  const intervalRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const mountedRef =
    useRef(false);

  const publishStatus = useCallback(
    (
      nextStatus: BackgroundGenerationStatus
    ) => {
      setStatus(nextStatus);

      try {
        localStorage.setItem(
          STATUS_KEY,
          JSON.stringify(nextStatus)
        );
      } catch (error) {
        console.error(
          "Background status save error:",
          error
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          STATUS_EVENT,
          {
            detail: nextStatus,
          }
        )
      );
    },
    []
  );

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(
        intervalRef.current
      );

      intervalRef.current = null;
    }
  }, []);

  const clearActiveJob = useCallback(() => {
    try {
      localStorage.removeItem(
        ACTIVE_JOB_KEY
      );
    } catch (error) {
      console.error(
        "Could not clear active generation:",
        error
      );
    }
  }, []);

  const saveActiveBookJob = (
    activeJob: ActiveBookJob
  ) => {
    try {
      localStorage.setItem(
        ACTIVE_JOB_KEY,
        JSON.stringify(activeJob)
      );
    } catch (error) {
      console.error(
        "Could not save active generation:",
        error
      );
    }
  };

  const pollBookJob = useCallback(
    async (activeJob: ActiveBookJob) => {
      if (!runningRef.current) {
        return;
      }

      const apiUrl = getApiUrl();

      try {
        const response = await fetch(
          `${apiUrl}/api/convert-book/${activeJob.jobId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Status request failed with HTTP ${response.status}.`
          );
        }

        const data: BookJobResponse =
          await response.json();

        const chapters =
          Array.isArray(data.chapters)
            ? data.chapters
            : [];

        const total =
          Number(
            data.total ||
              activeJob.totalChapters ||
              0
          );

        const completed =
          Number(
            data.completed || 0
          );

        const bookTitle =
          data.book_title ||
          activeJob.bookTitle;

        saveCompletedChapterAudio(
          activeJob.jobId,
          bookTitle,
          activeJob.voice,
          chapters,
          apiUrl
        );

        if (
          data.status === "completed"
        ) {
          runningRef.current = false;

          clearActiveJob();
          stopPolling();

          publishStatus({
            active: false,
            type: "book",
            title: bookTitle,
            completed,
            total,
            message:
              Number(data.errors || 0) >
              0
                ? `${completed} chapter(s) generated. ${data.errors} chapter(s) failed.`
                : `Audiobook generation completed. ${completed} chapter(s) generated.`,
            error:
              Number(data.errors || 0) >
              0,
          });

          window.dispatchEvent(
            new Event(
              "rafta-audiobooks-updated"
            )
          );

          return;
        }

        saveActiveBookJob({
          ...activeJob,
          bookTitle,
          totalChapters: total,
        });

        publishStatus({
          active: true,
          type: "book",
          title: bookTitle,
          completed,
          total,
          message:
            total > 0
              ? `Generating audiobook... ${completed}/${total} chapters complete.`
              : "Generating audiobook in the background...",
          error: false,
        });
      } catch (error) {
        console.error(
          "Background book polling error:",
          error
        );

        if (!mountedRef.current) {
          return;
        }

        publishStatus({
          active: true,
          type: "book",
          title: activeJob.bookTitle,
          completed: 0,
          total:
            activeJob.totalChapters,
          message:
            "Generation is still running. Reconnecting to the backend...",
          error: false,
        });
      }
    },
    [
      clearActiveJob,
      publishStatus,
      stopPolling,
    ]
  );

  const startBookGeneration =
    useCallback(
      async (payload: {
        text: string;
        title: string;
        voice: string;
      }) => {
        if (runningRef.current) {
          return;
        }

        runningRef.current = true;

        const apiUrl = getApiUrl();

        publishStatus({
          active: true,
          type: "book",
          title: payload.title,
          completed: 0,
          total: 0,
          message:
            "Starting audiobook generation...",
          error: false,
        });

        try {
          const response = await fetch(
            `${apiUrl}/api/convert-book`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                text: payload.text,
                book_title:
                  payload.title,
                voice: payload.voice,
              }),
            }
          );

          let data: {
            detail?: string;
            job_id?: string;
            book_title?: string;
            total_chapters?: number;
          } = {};

          try {
            data =
              await response.json();
          } catch {
            data = {};
          }

          if (!response.ok) {
            throw new Error(
              data.detail ||
                `Book conversion failed with HTTP ${response.status}.`
            );
          }

          if (!data.job_id) {
            throw new Error(
              "Backend did not return a conversion job ID."
            );
          }

          const activeJob: ActiveBookJob =
            {
              type: "book",
              jobId: data.job_id,
              bookTitle:
                data.book_title ||
                payload.title,
              voice: payload.voice,
              totalChapters:
                Number(
                  data.total_chapters ||
                    0
                ),
              startedAt:
                new Date().toISOString(),
            };

          saveActiveBookJob(
            activeJob
          );

          publishStatus({
            active: true,
            type: "book",
            title:
              activeJob.bookTitle,
            completed: 0,
            total:
              activeJob.totalChapters,
            message:
              activeJob.totalChapters >
              0
                ? `Generation started with ${activeJob.totalChapters} chapter(s). You can safely open any page.`
                : "Generation started. You can safely open any page.",
            error: false,
          });

          await pollBookJob(
            activeJob
          );

          if (!runningRef.current) {
            return;
          }

          stopPolling();

          intervalRef.current =
            window.setInterval(() => {
              void pollBookJob(
                activeJob
              );
            }, 1500);
        } catch (error) {
          runningRef.current = false;

          clearActiveJob();
          stopPolling();

          publishStatus({
            active: false,
            type: "book",
            title: payload.title,
            completed: 0,
            total: 0,
            message:
              error instanceof Error
                ? error.message
                : "Unable to start audiobook generation.",
            error: true,
          });
        }
      },
      [
        clearActiveJob,
        pollBookJob,
        publishStatus,
        stopPolling,
      ]
    );

  const startSingleGeneration =
    useCallback(
      async (payload: {
        text: string;
        title: string;
        voice: string;
      }) => {
        if (runningRef.current) {
          return;
        }

        runningRef.current = true;

        const apiUrl = getApiUrl();

        publishStatus({
          active: true,
          type: "single",
          title: payload.title,
          completed: 0,
          total: 1,
          message:
            "Generating audiobook in the background. You can safely open any page.",
          error: false,
        });

        try {
          const response = await fetch(
            `${apiUrl}/api/convert`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                text: payload.text,
                voice: payload.voice,
              }),
            }
          );

          let data: {
            detail?: string;
            audio_url?: string;
            audioUrl?: string;
            url?: string;
          } = {};

          try {
            data =
              await response.json();
          } catch {
            data = {};
          }

          if (!response.ok) {
            throw new Error(
              data.detail ||
                `Conversion failed with HTTP ${response.status}.`
            );
          }

          const generatedUrl =
            normalizeAudioUrl(
              data.audio_url ||
                data.audioUrl ||
                data.url ||
                "",
              apiUrl
            );

          if (!generatedUrl) {
            throw new Error(
              "Backend did not return an audio URL."
            );
          }

          const audiobook: Audiobook =
            {
              id:
                `single-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 8)}`,
              title:
                payload.title,
              voice:
                payload.voice,
              audioUrl:
                generatedUrl,
              createdAt:
                new Date().toISOString(),
            };

          const existing =
            getAudiobooks();

          saveAudiobooks([
            audiobook,
            ...existing,
          ]);

          window.dispatchEvent(
            new Event(
              "rafta-audiobooks-updated"
            )
          );

          runningRef.current = false;

          publishStatus({
            active: false,
            type: "single",
            title:
              payload.title,
            completed: 1,
            total: 1,
            message:
              "Audiobook generated successfully and saved to Library.",
            audioUrl:
              generatedUrl,
            error: false,
          });
        } catch (error) {
          runningRef.current = false;

          publishStatus({
            active: false,
            type: "single",
            title:
              payload.title,
            completed: 0,
            total: 1,
            message:
              error instanceof Error
                ? error.message
                : "Unable to generate audiobook.",
            error: true,
          });
        }
      },
      [publishStatus]
    );

  const handleStartGeneration =
    useCallback(
      (event: Event) => {
        const customEvent =
          event as CustomEvent<{
            type:
              | "book"
              | "single";
            text: string;
            title: string;
            voice: string;
          }>;

        const detail =
          customEvent.detail;

        if (!detail) {
          return;
        }

        if (
          !detail.text ||
          !detail.text.trim()
        ) {
          return;
        }

        if (
          detail.type === "book"
        ) {
          void startBookGeneration(
            {
              text:
                detail.text.trim(),
              title:
                detail.title ||
                "Untitled Audiobook",
              voice: detail.voice,
            }
          );
        } else {
          void startSingleGeneration(
            {
              text:
                detail.text.trim(),
              title:
                detail.title ||
                "Untitled Audiobook",
              voice: detail.voice,
            }
          );
        }
      },
      [
        startBookGeneration,
        startSingleGeneration,
      ]
    );

  useEffect(() => {
    mountedRef.current = true;

    try {
      const savedStatus =
        localStorage.getItem(
          STATUS_KEY
        );

      if (savedStatus) {
        const parsed =
          JSON.parse(
            savedStatus
          ) as BackgroundGenerationStatus;

        if (parsed) {
          setStatus(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Could not restore background status:",
        error
      );
    }

    window.addEventListener(
      START_EVENT,
      handleStartGeneration
    );

    return () => {
      mountedRef.current = false;

      window.removeEventListener(
        START_EVENT,
        handleStartGeneration
      );
    };
  }, [handleStartGeneration]);

  useEffect(() => {
    try {
      const storedJob =
        localStorage.getItem(
          ACTIVE_JOB_KEY
        );

      if (!storedJob) {
        return;
      }

      const activeJob =
        JSON.parse(
          storedJob
        ) as ActiveBookJob;

      if (
        !activeJob ||
        activeJob.type !== "book" ||
        !activeJob.jobId
      ) {
        localStorage.removeItem(
          ACTIVE_JOB_KEY
        );

        return;
      }

      runningRef.current = true;

      publishStatus({
        active: true,
        type: "book",
        title:
          activeJob.bookTitle,
        completed: 0,
        total:
          activeJob.totalChapters,
        message:
          "Resuming audiobook generation...",
        error: false,
      });

      void pollBookJob(
        activeJob
      ).then(() => {
        if (!runningRef.current) {
          return;
        }

        stopPolling();

        intervalRef.current =
          window.setInterval(() => {
            void pollBookJob(
              activeJob
            );
          }, 1500);
      });
    } catch (error) {
      console.error(
        "Could not restore active audiobook job:",
        error
      );
    }
  }, [
    pollBookJob,
    publishStatus,
    stopPolling,
  ]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  if (
    !status.active &&
    !status.message
  ) {
    return null;
  }

  const progress =
    status.total > 0
      ? Math.min(
          100,
          Math.round(
            (status.completed /
              status.total) *
              100
          )
        )
      : 0;

  return (
    <div
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 99999,
        width:
          "min(400px, calc(100vw - 40px))",
        padding: "16px",
        borderRadius: "16px",
        background: "#0b1423",
        border:
          "1px solid rgba(124,77,255,0.30)",
        boxShadow:
          "0 18px 50px rgba(0,0,0,0.45)",
        color: "#edf1fc",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <strong
          style={{
            fontSize: "14px",
          }}
        >
          🎧 RAFTA Generation
        </strong>

        {status.active && (
          <span
            style={{
              fontSize: "10px",
              padding:
                "4px 8px",
              borderRadius: "999px",
              background:
                "rgba(124,77,255,0.14)",
              color: "#bca9ff",
            }}
          >
            BACKGROUND
          </span>
        )}
      </div>

      {status.title && (
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "7px",
          }}
        >
          {status.title}
        </div>
      )}

      <div
        style={{
          fontSize: "12px",
          lineHeight: 1.45,
          opacity: 0.76,
          marginBottom:
            status.active &&
            status.total > 0
              ? "11px"
              : "0",
        }}
      >
        {status.message}
      </div>

      {status.active &&
        status.total > 0 && (
          <>
            <div
              style={{
                width: "100%",
                height: "7px",
                overflow: "hidden",
                borderRadius:
                  "999px",
                background:
                  "rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  width:
                    `${progress}%`,
                  height: "100%",
                  borderRadius:
                    "999px",
                  background:
                    "linear-gradient(90deg, #7c4dff, #00d4ff)",
                  transition:
                    "width 0.3s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: "7px",
                fontSize: "11px",
                opacity: 0.65,
              }}
            >
              {progress}% complete
            </div>
          </>
        )}
    </div>
  );
}