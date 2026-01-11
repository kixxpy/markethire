import React from 'react';
import styles from './FormattedText.module.css';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export default function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null;

  // Разбиваем текст на части: обычный текст и URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: Array<{ type: 'text' | 'link'; content: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Добавляем текст до URL
    if (match.index > lastIndex) {
      const textPart = text.substring(lastIndex, match.index);
      // Разбиваем на параграфы по переносам строк
      const paragraphs = textPart.split('\n');
      paragraphs.forEach((para, idx) => {
        if (para) {
          parts.push({ type: 'text', content: para });
        }
        if (idx < paragraphs.length - 1) {
          parts.push({ type: 'text', content: '\n' });
        }
      });
    }
    
    // Добавляем URL как ссылку
    parts.push({ type: 'link', content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    const paragraphs = remainingText.split('\n');
    paragraphs.forEach((para, idx) => {
      if (para) {
        parts.push({ type: 'text', content: para });
      }
      if (idx < paragraphs.length - 1) {
        parts.push({ type: 'text', content: '\n' });
      }
    });
  }

  // Если не было URL, просто разбиваем на параграфы
  if (parts.length === 0) {
    const paragraphs = text.split('\n');
    paragraphs.forEach((para, idx) => {
      if (para) {
        parts.push({ type: 'text', content: para });
      }
      if (idx < paragraphs.length - 1) {
        parts.push({ type: 'text', content: '\n' });
      }
    });
  }

  return (
    <div className={`${styles.formattedText} ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.content}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {part.content}
            </a>
          );
        } else if (part.content === '\n') {
          return <br key={index} />;
        } else {
          return <span key={index}>{part.content}</span>;
        }
      })}
    </div>
  );
}
