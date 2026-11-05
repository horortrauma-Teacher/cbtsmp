const fs = require('fs');
const path = require('path');

function updateVisualizerStateWithRayhan(customData = {}) {
  const now = new Date().toISOString();
  const state = {
    app: 'kantor-agent',
    version: '1.0.0',
    now: now,
    project: 'CBT SMP & SMA EduNusantara',
    names: 'Avero|El Fath|Zia|Heelwa|Mikaila',
    transcripts: true,
    ketua: {
      key: 'ketua',
      name: 'Avero',
      label: 'Avero',
      role: 'Ketua',
      kind: 'ketua',
      color: '#6a55c9',
      state: 'bekerja',
      activity: 'mengawasi-tim',
      session: 'anti-sess',
      updated: now,
      last: [{
        t: now,
        kind: 'tool',
        tool: 'delegate_task',
        text: 'Avero merekrut Rayhan (AI Accuracy Specialist) untuk audit akurasi & grounding internet'
      }],
      tools: 32,
      tokens: 88000,
      waiting_on: 1,
      other_sessions: 0,
      sessions: 1,
      todos: {
        items: [
          { text: 'Katalog Pelajaran & Topik SMP/SMA (El Fath)', status: 'completed' },
          { text: 'Engine AI Gemini 3 & Web Grounding (Mikaila)', status: 'completed' },
          { text: 'Rekrut Agen Khusus Akurasi & Pengujian Soal (Rayhan)', status: customData.rayhanStatus || 'in_progress' },
          { text: 'Eliminasi Soal Halu & Verifikasi Akurasi 100%', status: customData.auditStatus || 'in_progress' }
        ],
        at: now,
        source: 'antigravity-hub'
      }
    },
    team: [
      {
        key: 'tim-0',
        name: 'El Fath',
        label: 'El Fath',
        color: '#3f6fd1',
        kind: 'tim',
        slot: 0,
        desk: 0,
        state: 'santai',
        run: null
      },
      {
        key: 'tim-1',
        name: 'Zia',
        label: 'Zia',
        color: '#2f9a6d',
        kind: 'tim',
        slot: 1,
        desk: 1,
        state: 'santai',
        run: null
      },
      {
        key: 'tim-2',
        name: 'Heelwa',
        label: 'Heelwa',
        color: '#d9772f',
        kind: 'tim',
        slot: 2,
        desk: 2,
        state: 'santai',
        run: null
      },
      {
        key: 'tim-3',
        name: 'Mikaila',
        label: 'Mikaila',
        color: '#c2417a',
        kind: 'tim',
        slot: 3,
        desk: 3,
        state: 'bekerja',
        run: {
          id: 'run-ai-002',
          agent_type: 'Backend Specialist',
          task: 'Integrasi Web Grounding Wikipedia API & Gemini 3 Flash',
          status: 'bekerja',
          reason: null,
          segment: 1,
          started: now,
          ended: null,
          updated: now,
          last: [{ t: now, kind: 'tool', tool: 'write_file', text: 'Mikaila menghubungkan web-grounding.ts ke ai-question-generator.ts' }],
          files: ['src/lib/web-grounding.ts', 'src/lib/ai-question-generator.ts'],
          tools: 12,
          tokens: 29000
        }
      }
    ],
    freelancers: [
      {
        key: 'fl-rayhan-01',
        name: 'Rayhan',
        label: 'Freelancer · Rayhan',
        color: '#0f8fa3',
        kind: 'freelancer',
        slot: 0,
        desk: 0,
        state: 'bekerja',
        run: {
          id: 'run-rayhan-001',
          agent_type: 'AI Accuracy & Grounding Specialist',
          task: customData.rayhanTask || 'Audit Akurasi Soal AI, Web Grounding Retrieval & Pengujian Anti-Halusinasi',
          status: customData.rayhanState || 'bekerja',
          reason: null,
          segment: 1,
          started: now,
          ended: null,
          updated: now,
          last: [{
            t: now,
            kind: 'tool',
            tool: 'run_test',
            text: customData.rayhanLast || 'Rayhan menguji endpoint /api/ai/generate-soal untuk matematika, fisika, dan IPA'
          }],
          files: ['src/lib/ai-question-generator.ts', 'src/lib/web-grounding.ts'],
          tools: 6,
          tokens: 16500
        }
      }
    ],
    feed: [
      { t: now, who: 'fl-rayhan-01', name: 'Rayhan', color: '#0f8fa3', kind: 'tool', text: customData.rayhanFeed || 'Rayhan: Memvalidasi kebenaran ilmiah dan data numerik soal agar 100% bebas halusinasi' },
      { t: now, who: 'tim-3', name: 'Mikaila', color: '#c2417a', kind: 'tool', text: 'Mikaila: Model Gemini 3 Flash Preview & Gemma 4 aktif dengan Web Grounding' },
      { t: now, who: 'ketua', name: 'Avero', color: '#6a55c9', kind: 'assign', text: 'Avero menugaskan Rayhan menguji akurasi soal secara menyeluruh' }
    ],
    runs: [],
    stats: {
      active: 2,
      freelancers: 1,
      total: 5,
      recent_starts: [now],
      sessions_active: 1
    },
    spare_desks: 4,
    public_url: null
  };

  const targetPaths = [
    path.join(__dirname, '..', 'kantor-agent', 'skills', 'kantor-agent', 'runtime', 'antigravity-state.json'),
    path.join(__dirname, '..', 'antigravity-state.json')
  ];

  for (const p of targetPaths) {
    try {
      fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf8');
      console.log('State written to:', p);
    } catch (err) {
      console.error('Failed writing to:', p, err.message);
    }
  }
}

if (require.main === module) {
  updateVisualizerStateWithRayhan();
}

module.exports = { updateVisualizerStateWithRayhan };
