// Mythic GME 2e Fate Chart.
// VERIFY vs 2e book: values below are the 2e ladder as recalled, not yet checked against the rulebook.
//
// Each cell is [exceptionalYes, yes, exceptionalNo] on a d100 (1–100):
//   roll <= exceptionalYes -> Exceptional Yes
//   roll <= yes            -> Yes
//   roll >= exceptionalNo  -> Exceptional No
//   otherwise              -> No
// 0 means Exceptional Yes is impossible; 101 means Exceptional No is impossible.

export const ODDS = [
    'impossible',
    'nearly_impossible',
    'very_unlikely',
    'unlikely',
    '50_50',
    'likely',
    'very_likely',
    'nearly_certain',
    'certain',
];

export const ODDS_LABELS = {
    impossible: 'Impossible',
    nearly_impossible: 'Nearly Impossible',
    very_unlikely: 'Very Unlikely',
    unlikely: 'Unlikely',
    '50_50': '50/50',
    likely: 'Likely',
    very_likely: 'Very Likely',
    nearly_certain: 'Nearly Certain',
    certain: 'Certain',
};

// Rows: odds (same order as ODDS). Columns: Chaos Factor 1..9.
export const FATE_CHART = {
    impossible:        [[0, 1, 81], [0, 1, 81], [0, 1, 81], [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91]],
    nearly_impossible: [[0, 1, 81], [0, 1, 81], [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94]],
    very_unlikely:     [[0, 1, 81], [1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96]],
    unlikely:          [[1, 5, 82], [2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98]],
    '50_50':           [[2, 10, 83], [3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99]],
    likely:            [[3, 15, 84], [5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99], [19, 95, 100]],
    very_likely:       [[5, 25, 86], [7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99], [19, 95, 100], [20, 99, 101]],
    nearly_certain:    [[7, 35, 88], [10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99], [19, 95, 100], [20, 99, 101], [20, 99, 101]],
    certain:           [[10, 50, 91], [13, 65, 94], [15, 75, 96], [17, 85, 98], [18, 90, 99], [19, 95, 100], [20, 99, 101], [20, 99, 101], [20, 99, 101]],
};
