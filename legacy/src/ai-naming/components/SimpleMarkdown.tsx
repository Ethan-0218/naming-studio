import React from 'react';
import { View } from 'react-native';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';

export function renderInlineBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Font
          key={i}
          tag="secondaryMedium"
          style={{ fontSize: 13.5, color: colors.textPrimary }}
        >
          {part.slice(2, -2)}
        </Font>
      );
    }
    return (
      <Font
        key={i}
        tag="secondary"
        style={{ fontSize: 13.5, color: colors.textPrimary, lineHeight: 21 }}
      >
        {part}
      </Font>
    );
  });
}

export default function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return (
            <Font
              key={i}
              tag="primaryMedium"
              style={{
                fontSize: 16,
                color: colors.textPrimary,
                marginTop: 10,
                marginBottom: 4,
              }}
            >
              {line.slice(2)}
            </Font>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <Font
              key={i}
              tag="primaryMedium"
              style={{
                fontSize: 14.5,
                color: colors.textPrimary,
                marginTop: 8,
                marginBottom: 3,
              }}
            >
              {line.slice(3)}
            </Font>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <Font
              key={i}
              tag="secondaryMedium"
              style={{
                fontSize: 13.5,
                color: colors.textPrimary,
                marginTop: 6,
                marginBottom: 2,
              }}
            >
              {line.slice(4)}
            </Font>
          );
        }
        if (/^\d+\. /.test(line)) {
          const match = line.match(/^(\d+)\. (.*)$/);
          if (match) {
            return (
              <View key={i} className="flex-row" style={{ paddingLeft: 4 }}>
                <Font
                  tag="secondary"
                  style={{
                    fontSize: 13.5,
                    color: colors.textSecondary,
                    minWidth: 20,
                  }}
                >
                  {match[1]}.{' '}
                </Font>
                <View className="flex-1 flex-row flex-wrap">
                  {renderInlineBold(match[2])}
                </View>
              </View>
            );
          }
        }
        if (line.startsWith('- ')) {
          return (
            <View key={i} className="flex-row" style={{ paddingLeft: 6 }}>
              <Font
                tag="secondary"
                style={{ fontSize: 13.5, color: colors.textSecondary }}
              >
                {'• '}
              </Font>
              <View className="flex-1 flex-row flex-wrap">
                {renderInlineBold(line.slice(2))}
              </View>
            </View>
          );
        }
        if (line === '') {
          return <View key={i} style={{ height: 6 }} />;
        }
        return (
          <View key={i} className="flex-row flex-wrap">
            {renderInlineBold(line)}
          </View>
        );
      })}
    </View>
  );
}
