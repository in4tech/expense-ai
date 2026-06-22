
import torch
import torch.nn as nn

from torch.utils.data import DataLoader

from model import CaptionModel
from dataset import FlickDateset

from vocab import save_vocab

DEVICE = (
    "cuda" if torch.cuda.is_available()
    else "mps" if torch.backends.mps.is_available()
    else "cpu"
)

EMBED_SIZE = 256
HIDDEN_SIZE = 512

BATCH_SIZE = 16
EPOCHS = 20
LR = 1e-3

dataset = FlickDateset(
    image_dir="dataset/Images",
    captions_file="dataset/captions.txt"
)

save_vocab(dataset.vocab)

PAD_IDX = dataset.vocab.stoi["<PAD>"]

def collate_fn(batch):
    images = [item[0] for item in batch]
    captions = [item[1] for item in batch]

    images = torch.stack(images) # -> (batch_size, 3, 224, 224)
    
    captions = nn.utils.rnn.pad_sequence(
        captions,
        batch_first=True,
        padding_value=PAD_IDX
    ) # -> Tensor.size([1, 6, 7, 2])
    

    return images, captions 

loader = DataLoader(
    dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    collate_fn=collate_fn
) # -> (images, captions)

model = CaptionModel(
    EMBED_SIZE,
    HIDDEN_SIZE,
    len(dataset.vocab)
).to(DEVICE)

# CrossEntropyLoss là hàm mất mát cho bài toán phân loại nhiều lớp
# ignore_index là giá trị mà ta muốn bỏ qua khi tính toán loss
# -> Model dự đoán sai bao nhiêu?
criterion = nn.CrossEntropyLoss(
    ignore_index=PAD_IDX
)

# Adam là một bộ tối ưu hóa (optimizer)
# -> Sau khi biết model sai, phải cập nhật weights để model tốt hơn
optimizer = torch.optim.Adam(
    model.parameters(),
    lr=LR
)

for epoch in range(EPOCHS):
    model.train()

    total_loss = 0

    for images, captions in loader:
        images = images.to(DEVICE)
        captions = captions.to(DEVICE)

        outputs = model(
            images,
            captions
        )

        loss = criterion(
            outputs.reshape(
                -1,
                outputs.shape[2]
            ),
            captions.reshape(-1)
        ) # -> Tensor.size([batch_size * seq_len, vocab_size])

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(
        f"Epoch {epoch+1}/{EPOCHS} "
        f"Loss={total_loss/len(loader):.4f}"
    )

torch.save(
    model.state_dict(),
    "caption_model.pkl"
)

print("Traning finished")