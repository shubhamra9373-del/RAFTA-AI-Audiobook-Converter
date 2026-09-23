"use client";

import Link from "next/link";

export interface AudiobookCardData {
id: string;
title: string;
voice?: string;
audioUrl?: string;
createdAt?: string;
}

interface AudiobookCardProps {
audiobook: AudiobookCardData;
onDelete?: (id: string) => void;
}

export default function AudiobookCard({
audiobook,
onDelete,
}: AudiobookCardProps) {
const {
id,
title,
voice = "AI Voice",
audioUrl,
createdAt,
} = audiobook;

const formattedDate = createdAt
? new Date(createdAt).toLocaleDateString()
: "";

return ( <div className="audiobook-card"> <div className="audiobook-card-cover"> <div className="audiobook-card-icon">🎧</div> </div>

```
  <div className="audiobook-card-content">
    <h3 className="audiobook-card-title">
      {title || "Untitled Audiobook"}
    </h3>

    <p className="audiobook-card-voice">
      Voice: {voice}
    </p>

    {formattedDate && (
      <p className="audiobook-card-date">{formattedDate}</p>
    )}

    <div className="audiobook-card-actions">
      {audioUrl ? (
        <Link
          href={`/player?id=${encodeURIComponent(id)}`}
          className="audiobook-card-play"
        >
          ▶ Play
        </Link>
      ) : (
        <span className="audiobook-card-no-audio">
          Audio unavailable
        </span>
      )}

      {audioUrl && (
        <a
          href={audioUrl}
          download
          className="audiobook-card-download"
        >
          ↓ Download
        </a>
      )}

      {onDelete && (
        <button
          type="button"
          className="audiobook-card-delete"
          onClick={() => onDelete(id)}
        >
          Delete
        </button>
      )}
    </div>
  </div>
</div>
```

);
}
