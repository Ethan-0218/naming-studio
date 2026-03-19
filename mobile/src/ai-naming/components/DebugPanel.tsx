import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Font } from '@/components/Font';
import { ApiResponse } from '../types';

interface Props {
  debug: ApiResponse['debug'];
}

export default function DebugPanel({ debug }: Props) {
  const [open, setOpen] = useState(false);
  if (!debug) return null;
  return (
    <View className="w-full mb-1 rounded-lg overflow-hidden border border-[#333]">
      <Pressable
        className="bg-[#1e1e2e] px-2.5 py-1.5"
        onPress={() => setOpen((v) => !v)}
      >
        <Font tag="secondary" style={{ fontSize: 11, color: '#7c7cff' }}>
          {open ? '▾' : '▸'} DEBUG
        </Font>
      </Pressable>
      {open && (
        <ScrollView
          className="bg-[#12121f] max-h-[500px] p-2.5"
          nestedScrollEnabled
        >
          <ScrollView horizontal nestedScrollEnabled>
            <View>
              {debug.raw_llm_output != null && (
                <>
                  <Font tag="secondary" style={{ fontSize: 10, color: '#555' }}>
                    {'── raw LLM output ──'}
                  </Font>
                  <Font
                    tag="secondary"
                    style={{ fontSize: 11, color: '#a8ff78', lineHeight: 17 }}
                  >
                    {debug.raw_llm_output}
                  </Font>
                </>
              )}
              {debug.state != null && (
                <>
                  <Font
                    tag="secondary"
                    style={{ fontSize: 10, color: '#555', marginTop: 10 }}
                  >
                    {'── state snapshot ──'}
                  </Font>
                  <Font
                    tag="secondary"
                    style={{ fontSize: 11, color: '#a8ff78', lineHeight: 17 }}
                  >
                    {JSON.stringify(debug.state, null, 2)}
                  </Font>
                </>
              )}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}
