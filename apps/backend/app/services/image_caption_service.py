import io
import sys
from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms

from app.data.image_captioning import vocab as vocab_module
from app.data.image_captioning.model import CaptionModel
from app.data.image_captioning.vocab import load_vocab

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "image_captioning"
MODEL_PATH = DATA_DIR / "caption_model.pkl"
VOCAB_PATH = DATA_DIR / "vocab.pkl"

EMBED_SIZE = 256
HIDDEN_SIZE = 512
MAX_CAPTION_LENGTH = 25

DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "mps"
    if torch.backends.mps.is_available()
    else "cpu"
)

try:
    import pillow_heif  # pyright: ignore[reportMissingImports]

    pillow_heif.register_heif_opener()
except ImportError:
    pass

_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

_model: CaptionModel | None = None
_vocab = None


def _get_model_and_vocab():
    global _model, _vocab

    if _model is not None and _vocab is not None:
        return _model, _vocab

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "caption_model.pkl not found. Run image_captioning/train.py first."
        )
    if not VOCAB_PATH.exists():
        raise FileNotFoundError(
            "vocab.pkl not found. Run image_captioning/train.py first."
        )

    sys.modules.setdefault("vocab", vocab_module)
    vocab = load_vocab(str(VOCAB_PATH))
    model = CaptionModel(EMBED_SIZE, HIDDEN_SIZE, len(vocab))
    model.load_state_dict(
        torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
    )
    model.to(DEVICE)
    model.eval()

    _model = model
    _vocab = vocab
    return model, vocab


def _load_rgb_image(image_bytes: bytes) -> Image.Image:
    if not image_bytes:
        raise ValueError("Uploaded file is empty.")

    buffer = io.BytesIO(image_bytes)
    try:
        with Image.open(buffer) as image:
            image.load()
            return image.convert("RGB")
    except Exception as exc:
        raise ValueError(
            "Could not read image. Please use JPEG or PNG, or retake the photo."
        ) from exc


def generate_caption(image_bytes: bytes, max_length: int = MAX_CAPTION_LENGTH) -> str:
    model, vocab = _get_model_and_vocab()

    image = _load_rgb_image(image_bytes)
    image_tensor = _transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        feature = model.encoder(image_tensor)

        states = None
        word = torch.tensor([[vocab.stoi["<SOS>"]]]).to(DEVICE)
        caption: list[str] = []

        for _ in range(max_length):
            embedding = model.decoder.embedding(word)

            if len(caption) == 0:
                embedding = torch.cat(
                    (feature.unsqueeze(1), embedding),
                    dim=1,
                )

            output, states = model.decoder.lstm(embedding, states)
            scores = model.decoder.fc(output[:, -1])
            predicted = scores.argmax(dim=1)
            idx = predicted.item()

            token = vocab.itos[idx]
            if token == "<EOS>":
                break

            caption.append(token)
            word = predicted.unsqueeze(0)

    return " ".join(caption)
