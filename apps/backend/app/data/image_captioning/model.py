import torch
import torch.nn as nn

from torchvision import models

class EncoderCNN(nn.Module):
    def __init__(self, embed_size):
        super().__init__()

        resnet = models.resnet50(
            weights=models.ResNet50_Weights.IMAGENET1K_V2
        )

        print(resnet)

        for param in resnet.parameters():
            param.requires_grad = False

        modules = list(resnet.children())[:-1]

        print(modules)
        self.resnet = nn.Sequential(*modules)
        self.fc = nn.Linear(2048, embed_size)

    
    def forward(self, images):
        features = self.resnet(images)
        features = features.reshape(features.size(0), -1)

        features = self.fc(features)

        return features


class DecoderCNN(nn.Module):
    def __init__(self, embed_size, hidden_size, vocab_size, num_layers=1):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embed_size)
        self.lstm = nn.LSTM(
            embed_size,
            hidden_size,
            num_layers,
            batch_first=True
        )

        self.fc = nn.Linear(hidden_size, vocab_size)

    def forward(self, features, captions):
        embeddings = self.embedding(captions[:, :-1])

        features = features.unsqueeze(1)
        embeddings = torch.cat((features, embeddings), dim=1)

        hiddens, _ = self.lstm(embeddings)
        outputs = self.fc(hiddens)

        return outputs


class CaptionModel(nn.Module):
    def __init__(self, embed_size, hidden_size, vocab_size):
        super().__init__()

        self.encoder = EncoderCNN(embed_size)
        self.decoder = DecoderCNN(embed_size, hidden_size, vocab_size)

    def forward(self, images, captions):
        features = self.encoder(images)

        outputs = self.decoder(features, captions)

        return outputs
