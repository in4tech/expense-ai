import pandas as pd

from PIL import Image

import torch
from torch.utils.data import Dataset
from torchvision import transforms

from vocab import Vocabulary

class FlickDateset(Dataset):
    def __init__(self, image_dir, captions_file, vocab=None):
        self.image_dir = image_dir

        self.df = pd.read_csv(captions_file)

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])

        if vocab is None:
            self.vocab = Vocabulary()
            self.vocab.build_vocabulary(self.df["caption"].to_list())
        else:
            self.vocab = vocab

    def __len__(self):
        return len(self.df)

    def __getitem__(self, index):
        row = self.df.iloc[index]

        image_path = f"{self.image_dir}/{row['image']}"
        image = Image.open(image_path).convert("RGB")
        image = self.transform(image)

        caption = row["caption"]

        numericalized_caption = [self.vocab.stoi["<SOS>"]]
        numericalized_caption += self.vocab.numbericalize(caption)
        numericalized_caption.append(self.vocab.stoi["<EOS>"])

        return (
            image,
            torch.tensor(
                numericalized_caption
            )
        )
        