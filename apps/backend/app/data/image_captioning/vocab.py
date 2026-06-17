import pickle
from collections import Counter

class Vocabulary:
    def __init__(self, freq_threshold=5):
        self.freq_threshold = freq_threshold

        self.itos = {
            0: "<PAD>",
            1: "<SOS>",
            2: "<EOS>",
            3: "<UNK>"
        }

        self.stoi = {
            "<PAD>": 0,
            "<SOS>": 1,
            "<EOS>": 2,
            "<UNK>": 3,
        }

    def __len__(self):
        return len(self.itos)

    def tokenizer(self, text):
        return text.lower().strip().split()

    def build_vocabulary(self, sentence_list):
        frequences = Counter()

        idx = 4
        for sentence in sentence_list:
            for word in self.tokenizer(sentence):
                frequences[word] += 1

                if frequences[word] == self.freq_threshold:
                    self.stoi[word] = idx
                    self.itos[idx] = word
                    idx += 1

    def numbericalize(self, text):
        tokenized_text = self.tokenizer(text)

        return [
            self.stoi.get(token, self.stoi["<UNK>"])
            for token in tokenized_text
        ]


def save_vocab(vocab, filename="vocab.pkl"):
    with open(filename, "wb") as f:
        pickle.dump(vocab, f)


def load_vocab(filename="vocab.pkl"):
    with open(filename, "rb") as f:
        return pickle.load(f)

        