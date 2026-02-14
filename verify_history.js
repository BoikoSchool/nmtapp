
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('history_questions.json', 'utf8'));

// Cyrillic map
const cyrillic = {
    'A': 'А', 'B': 'В', 'E': 'Е', 'H': 'Н', 'I': 'І', 'K': 'К', 'M': 'М', 'O': 'О', 'P': 'Р', 'T': 'Т', 'X': 'Х'
};
// Latin map
const latin = {
    'А': 'A', 'В': 'B', 'Е': 'E', 'Н': 'H', 'І': 'I', 'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X'
}

let errors = [];

data.forEach(q => {
    if (q.type === 'multiple_choice_3') {
        const optionIds = q.options.map(o => o.id);
        const correct = q.correct_answer; // Array

        correct.forEach(ans => {
            if (!optionIds.includes(ans)) {
                // If not found, check if it's a lookalike
                let alt = cyrillic[ans] || latin[ans];
                let msg = `Q${q.content.substring(0, 20)}... Missing answer '${ans}'.`;

                if (alt && optionIds.includes(alt)) {
                    msg += ` FOUND LOOKALIKE '${alt}' in options!`;
                } else {
                    msg += ` Options: ${optionIds.join(', ')}`;
                }
                errors.push(msg);
            }
        });
    }

    if (q.type === 'matching') {
        const optionIds = q.options.options.map(o => o.id);
        const correctObj = q.correct_answer;
        Object.values(correctObj).forEach(ans => {
            if (!optionIds.includes(ans)) {
                errors.push(`Q${q.content.substring(0, 20)}... Matching answer '${ans}' not in options ${optionIds.join(', ')}`);
            }
        });
    }
});

if (errors.length > 0) {
    console.error("ERRORS FOUND:");
    console.error(errors.join('\n'));
} else {
    console.log("All verify checks passed.");
}
