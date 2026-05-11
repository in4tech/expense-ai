import re


def parse_receipt(text: str):
    total_match = re.search(r"Thanh tien[:\s]+([\d,]+)", text)

    merchant = None
    total = None

    lines = text.split("\n")

    if len(lines) > 0:
        merchant = lines[0].strip()

    if total_match:
        total_str = total_match.group(1).replace(",", "")
        total = float(total_str)

    return {
        "merchant": merchant,
        "total": total,
        "category": "Food & Beverage"
    }