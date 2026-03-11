import React from 'react';

const HighlightWord = ({ text, wordToBold }: {text: string, wordToBold: string}) => {
    if (!wordToBold || wordToBold.trim() === '') {
        return <span>{text}</span>;
    }

    // Create a case-insensitive regular expression with the 'g' flag for global matching
    const regex = new RegExp(`(${wordToBold})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) => {
                // Check if the current part matches the word to bold
                if (regex.test(part)) {
                    return (
                        // Use <strong> for semantic importance or a span with a bold class/style
                        <strong key={index}>{part}</strong>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};

export default HighlightWord;
