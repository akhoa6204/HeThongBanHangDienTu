def avg_review(review_list):
    if not review_list:
        return None
    total = 0
    for review in review_list:
        total += review.star_count
    return total / len(review_list)
