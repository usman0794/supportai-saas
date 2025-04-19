from datetime import datetime, timezone


# Demo banking data for testing tool calling.
# Later, this can be replaced with a real bank API or database.
MOCK_CARDS = {
    "CARD123": {
        "status": "Dispatched",
        "last_updated": "2026-09-23",
    },
    "CARD456": {
        "status": "Active",
        "last_updated": "2026-09-22",
    },
    "CARD789": {
        "status": "Blocked",
        "last_updated": "2026-09-20",
    },
}


def get_card_status(card_number: str) -> dict:
    """
    Return the current status of a customer's card.
    """

    card_number = card_number.strip().upper()

    card = MOCK_CARDS.get(card_number)

    if not card:
        return {
            "found": False,
            "card_number": card_number,
            "message": "Card not found.",
        }

    return {
        "found": True,
        "card_number": card_number,
        "status": card["status"],
        "last_updated": card["last_updated"],
    }