
import torch
from PIL import Image

from torchvision import transforms

from model import CaptionModel
from vocab import load_vocab

DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

EMBED_SIZE = 256
HIDDEN_SIZE = 512

vocab = load_vocab()
model = CaptionModel(
    EMBED_SIZE,
    HIDDEN_SIZE,
    len(vocab)
)

model.load_state_dict(
    torch.load(
        "caption_model.pth",
        map_location=DEVICE
    )
)

model.to(DEVICE)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def generate_caption(image_path, max_length=20):
    image = Image.open(image_path).convert("RGB")

    image = transform(image).unsqueeze(0)
    image = image.to(DEVICE)

    with torch.no_grad():
        feature = model.encoder(image)

        states = None
        word = torch.tensor([[vocab.stoi["<SOS>"]]]).to(DEVICE)

        caption = []

        for _ in range(max_length):
            embedding = model.decoder.embedding(word)

            if len(caption) == 0:
                embedding = torch.cat(
                    (
                        feature.unsqueeze(1),
                        embedding
                    ),
                    dim=1
                )

            output, states = (
                model.decoder.lstm(
                    embedding,
                    states
                )
            )

            scores = (
                model.decoder.fc(
                    output[:, -1]
                )
            )

            predicted = scores.argmx(dim=1)
            idx = predicted.item()

            token = vocab.itos[idx]
            if token == "<EOS>":
                break

            caption.append(token)
            word = predicted.unsqueeze(0)

        return " ".join(caption)

print(generate_caption("test.jpg"))