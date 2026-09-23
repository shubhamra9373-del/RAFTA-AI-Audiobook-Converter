import os
import uuid
import edge_tts


async def generate_audio(text: str, voice: str):
    output_folder = "generated_audio"

    os.makedirs(output_folder, exist_ok=True)

    filename = f"{uuid.uuid4()}.mp3"

    output_path = os.path.join(
        output_folder,
        filename
    )

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice
    )

    await communicate.save(output_path)

    return output_path
import os
import uuid
import edge_tts


async def generate_audio(text: str, voice: str):
    output_folder = "generated_audio"

    os.makedirs(output_folder, exist_ok=True)

    filename = f"{uuid.uuid4()}.mp3"

    output_path = os.path.join(
        output_folder,
        filename
    )

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice
    )

    await communicate.save(output_path)

    return output_path