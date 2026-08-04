<template>
  <div class="benchmark-charts">
    <!-- Header -->
    <div class="bm-header">
      <div class="bm-meta">
        <span class="bm-badge">⚡ Live Benchmark Data</span>
        <span class="bm-timestamp">
          Ran on {{ formattedDate }} · Node.js {{ payload.nodeVersion }} · {{ payload.platform }}/{{ payload.arch }}
        </span>
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="bm-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="bm-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Chart area -->
    <div class="bm-chart-wrapper">
      <!-- Throughput Chart -->
      <div v-show="activeTab === 'throughput'" class="bm-chart-container">
        <h3 class="bm-chart-title">Sequential Throughput (ops / sec)</h3>
        <p class="bm-chart-subtitle">Higher is better · 100,000 sequential interaction dispatches</p>
        <div class="bm-bars">
          <div
            v-for="r in results"
            :key="r.name + '-thr'"
            class="bm-bar-row"
          >
            <span class="bm-bar-label" :title="r.name">{{ r.name }}</span>
            <div class="bm-bar-track">
              <div
                class="bm-bar-fill"
                :class="r.type === 'shardix' ? 'shardix' : 'raw'"
                :style="{ width: barWidth(r.opsPerSec, maxOps) + '%' }"
              >
                <span class="bm-bar-value">{{ formatOps(r.opsPerSec) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Latency Chart -->
      <div v-show="activeTab === 'latency'" class="bm-chart-container">
        <h3 class="bm-chart-title">Latency Percentiles (µs — microseconds)</h3>
        <p class="bm-chart-subtitle">Lower is better · p50 / p95 / p99 distribution</p>
        <div class="bm-bars">
          <div
            v-for="r in results"
            :key="r.name + '-lat'"
            class="bm-bar-row latency-row"
          >
            <span class="bm-bar-label" :title="r.name">{{ r.name }}</span>
            <div class="bm-latency-group">
              <div class="bm-latency-bars">
                <div class="bm-latency-bar-wrap" title="p50">
                  <div
                    class="bm-latency-bar p50"
                    :class="r.type === 'shardix' ? 'shardix' : 'raw'"
                    :style="{ width: barWidth(r.p50LatencyUs, maxLatency) + '%' }"
                  />
                  <span class="bm-latency-value">{{ r.p50LatencyUs }} µs</span>
                </div>
                <div class="bm-latency-bar-wrap" title="p95">
                  <div
                    class="bm-latency-bar p95"
                    :class="r.type === 'shardix' ? 'shardix' : 'raw'"
                    :style="{ width: barWidth(r.p95LatencyUs, maxLatency) + '%' }"
                  />
                  <span class="bm-latency-value muted">p95: {{ r.p95LatencyUs }} µs</span>
                </div>
                <div class="bm-latency-bar-wrap" title="p99">
                  <div
                    class="bm-latency-bar p99"
                    :class="r.type === 'shardix' ? 'shardix' : 'raw'"
                    :style="{ width: barWidth(r.p99LatencyUs, maxLatency) + '%' }"
                  />
                  <span class="bm-latency-value muted">p99: {{ r.p99LatencyUs }} µs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bm-legend">
          <span class="legend-swatch p50"></span> p50 (median)
          <span class="legend-swatch p95 ml"></span> p95
          <span class="legend-swatch p99 ml"></span> p99
        </div>
      </div>

      <!-- Concurrent Chart -->
      <div v-show="activeTab === 'concurrent'" class="bm-chart-container">
        <h3 class="bm-chart-title">Concurrent Throughput (ops / sec)</h3>
        <p class="bm-chart-subtitle">Higher is better · 100 parallel interactions × 100 rounds = 10,000 total</p>
        <div class="bm-bars">
          <div
            v-for="r in results"
            :key="r.name + '-conc'"
            class="bm-bar-row"
          >
            <span class="bm-bar-label" :title="r.name">{{ r.name }}</span>
            <div class="bm-bar-track">
              <div
                class="bm-bar-fill"
                :class="r.type === 'shardix' ? 'shardix' : 'raw'"
                :style="{ width: barWidth(r.concurrentOpsPerSec, maxConcOps) + '%' }"
              >
                <span class="bm-bar-value">{{ formatOps(r.concurrentOpsPerSec) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Memory Chart -->
      <div v-show="activeTab === 'memory'" class="bm-chart-container">
        <h3 class="bm-chart-title">Resident Set Size Memory (MB)</h3>
        <p class="bm-chart-subtitle">Lower is better · RSS after steady-state benchmark run</p>
        <div class="bm-bars">
          <div
            v-for="r in results"
            :key="r.name + '-mem'"
            class="bm-bar-row"
          >
            <span class="bm-bar-label" :title="r.name">{{ r.name }}</span>
            <div class="bm-bar-track">
              <div
                class="bm-bar-fill memory"
                :class="r.type === 'shardix' ? 'shardix' : 'raw'"
                :style="{ width: barWidth(r.memoryRssMB, maxRss) + '%' }"
              >
                <span class="bm-bar-value">{{ r.memoryRssMB }} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Boot Time Chart -->
      <div v-show="activeTab === 'boot'" class="bm-chart-container">
        <h3 class="bm-chart-title">Bootstrap Time (ms)</h3>
        <p class="bm-chart-subtitle">Lower is better · Time from constructor to first-ready state</p>
        <div class="bm-bars">
          <div
            v-for="r in results"
            :key="r.name + '-boot'"
            class="bm-bar-row"
          >
            <span class="bm-bar-label" :title="r.name">{{ r.name }}</span>
            <div class="bm-bar-track">
              <div
                class="bm-bar-fill boot"
                :class="r.type === 'shardix' ? 'shardix' : 'raw'"
                :style="{ width: barWidth(r.bootstrapMs, maxBoot, true) + '%' }"
              >
                <span class="bm-bar-value">{{ r.bootstrapMs }} ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Table -->
    <div class="bm-table-wrapper">
      <h3 class="bm-section-title">Full Results</h3>
      <div class="bm-scroll">
        <table class="bm-table">
          <thead>
            <tr>
              <th>Engine</th>
              <th>Type</th>
              <th>Boot (ms)</th>
              <th>RSS (MB)</th>
              <th>Ops/sec</th>
              <th>p50 (µs)</th>
              <th>p95 (µs)</th>
              <th>p99 (µs)</th>
              <th>Conc. Ops/sec</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r.name + '-row'" :class="r.type === 'shardix' ? 'shardix-row' : 'raw-row'">
              <td class="name-cell">
                <span class="type-dot" :class="r.type"></span>
                {{ r.name }}
              </td>
              <td>
                <span class="badge" :class="r.type">{{ r.type === 'shardix' ? '🔷 Shardix' : '⬜ Raw' }}</span>
              </td>
              <td>{{ r.bootstrapMs }}</td>
              <td>{{ r.memoryRssMB }}</td>
              <td class="highlight">{{ formatOps(r.opsPerSec) }}</td>
              <td>{{ r.p50LatencyUs }}</td>
              <td class="muted-cell">{{ r.p95LatencyUs }}</td>
              <td class="muted-cell">{{ r.p99LatencyUs }}</td>
              <td>{{ formatOps(r.concurrentOpsPerSec) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Overhead Analysis -->
    <div class="bm-analysis">
      <h3 class="bm-section-title">Shardix Overhead Analysis</h3>
      <div class="bm-pairs">
        <div v-for="pair in pairs" :key="pair.lib" class="bm-pair-card">
          <div class="pair-lib">{{ pair.libLabel }}</div>
          <div class="pair-stats">
            <div class="pair-stat">
              <span class="stat-label">p50 overhead</span>
              <span class="stat-value overhead">+{{ pair.p50Overhead }} µs</span>
            </div>
            <div class="pair-stat">
              <span class="stat-label">p95 overhead</span>
              <span class="stat-value overhead">+{{ pair.p95Overhead }} µs</span>
            </div>
            <div class="pair-stat">
              <span class="stat-label">Throughput ratio</span>
              <span class="stat-value ratio">{{ pair.throughputRatio }}×</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface BenchmarkMetric {
  name: string;
  library: string;
  type: 'raw' | 'shardix';
  bootstrapMs: number;
  shutdownMs: number;
  memoryHeapMB: number;
  memoryRssMB: number;
  opsPerSec: number;
  avgLatencyUs: number;
  p50LatencyUs: number;
  p95LatencyUs: number;
  p99LatencyUs: number;
  concurrentOpsPerSec: number;
}

interface BenchmarkPayload {
  timestamp: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  results: BenchmarkMetric[];
}

const props = defineProps<{ payload: BenchmarkPayload }>();

const tabs = [
  { id: 'throughput', label: '⚡ Throughput' },
  { id: 'latency', label: '⏱ Latency p50/p95/p99' },
  { id: 'concurrent', label: '🔀 Concurrent Load' },
  { id: 'memory', label: '💾 Memory' },
  { id: 'boot', label: '🚀 Boot Time' },
];

const activeTab = ref('throughput');

const results = computed(() => props.payload.results);

const formattedDate = computed(() => {
  try {
    return new Date(props.payload.timestamp).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return props.payload.timestamp;
  }
});

const maxOps = computed(() => Math.max(...results.value.map((r) => r.opsPerSec)));
const maxConcOps = computed(() => Math.max(...results.value.map((r) => r.concurrentOpsPerSec)));
const maxLatency = computed(() => Math.max(...results.value.map((r) => r.p99LatencyUs)));
const maxRss = computed(() => Math.max(...results.value.map((r) => r.memoryRssMB)));
const maxBoot = computed(() => Math.max(...results.value.map((r) => r.bootstrapMs)));

function barWidth(value: number, max: number, log = false): number {
  if (max === 0) return 0;
  if (log) {
    // log scale for boot time to make small values visible
    const logVal = Math.log1p(value);
    const logMax = Math.log1p(max);
    return Math.min(100, Math.max(4, (logVal / logMax) * 100));
  }
  return Math.min(100, Math.max(2, (value / max) * 100));
}

function formatOps(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

const pairs = computed(() => {
  const libs = ['discord.js', 'eris', 'oceanic.js', 'discordeno'];
  const labels: Record<string, string> = {
    'discord.js': 'Discord.js v14',
    'eris': 'Eris v0.18',
    'oceanic.js': 'Oceanic.js v1.14',
    'discordeno': 'Discordeno v21',
  };

  return libs.map((lib) => {
    const raw = results.value.find((r) => r.library === lib && r.type === 'raw');
    const shardix = results.value.find((r) => r.library === lib && r.type === 'shardix');

    if (!raw || !shardix) return null;

    const p50Overhead = (shardix.p50LatencyUs - raw.p50LatencyUs).toFixed(2);
    const p95Overhead = (shardix.p95LatencyUs - raw.p95LatencyUs).toFixed(2);
    const throughputRatio = (shardix.opsPerSec / raw.opsPerSec).toFixed(3);

    return {
      lib,
      libLabel: labels[lib],
      p50Overhead,
      p95Overhead,
      throughputRatio,
    };
  }).filter(Boolean);
});
</script>

<style scoped>
/* ─── Wrapper ─────────────────────────────────────────────────────────────── */
.benchmark-charts {
  margin: 2rem 0;
  font-family: var(--vp-font-family-base);
}

/* ─── Header ──────────────────────────────────────────────────────────────── */
.bm-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.bm-meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.bm-badge {
  display: inline-block;
  background: linear-gradient(135deg, #5865f2 0%, #7983f5 100%);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  width: fit-content;
}

.bm-timestamp {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

/* ─── Tabs ────────────────────────────────────────────────────────────────── */
.bm-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.bm-tab {
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1.5px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}

.bm-tab:hover {
  border-color: #5865f2;
  color: #5865f2;
}

.bm-tab.active {
  background: #5865f2;
  border-color: #5865f2;
  color: #fff;
  font-weight: 700;
}

/* ─── Chart Container ─────────────────────────────────────────────────────── */
.bm-chart-wrapper {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.bm-chart-container {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.bm-chart-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.25rem;
}

.bm-chart-subtitle {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  margin: 0 0 1.5rem;
}

/* ─── Bar Chart ───────────────────────────────────────────────────────────── */
.bm-bars {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.bm-bar-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  align-items: center;
  gap: 0.75rem;
}

.bm-bar-label {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bm-bar-track {
  background: var(--vp-c-bg-mute);
  border-radius: 6px;
  height: 26px;
  overflow: hidden;
  position: relative;
}

.bm-bar-fill {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 2%;
}

.bm-bar-fill.shardix {
  background: linear-gradient(90deg, #5865f2 0%, #7983f5 100%);
}

.bm-bar-fill.raw {
  background: linear-gradient(90deg, #2d3748 0%, #4a5568 100%);
}

.bm-bar-fill.memory.shardix {
  background: linear-gradient(90deg, #38a169 0%, #48bb78 100%);
}

.bm-bar-fill.memory.raw {
  background: linear-gradient(90deg, #c05621 0%, #dd6b20 100%);
}

.bm-bar-fill.boot.shardix {
  background: linear-gradient(90deg, #805ad5 0%, #9f7aea 100%);
}

.bm-bar-fill.boot.raw {
  background: linear-gradient(90deg, #2b6cb0 0%, #4299e1 100%);
}

.bm-bar-value {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}

/* ─── Latency bars ────────────────────────────────────────────────────────── */
.latency-row {
  grid-template-columns: 220px 1fr;
  align-items: flex-start;
}

.bm-latency-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bm-latency-bars {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bm-latency-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 14px;
}

.bm-latency-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 2%;
}

.bm-latency-bar.p50 { opacity: 1.0; }
.bm-latency-bar.p95 { opacity: 0.65; }
.bm-latency-bar.p99 { opacity: 0.4; }

.bm-latency-bar.shardix { background: #5865f2; }
.bm-latency-bar.raw { background: #718096; }

.bm-latency-value {
  font-size: 0.7rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.bm-latency-value.muted {
  color: var(--vp-c-text-3);
}

.bm-legend {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.legend-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-swatch.p50 { background: #5865f2; }
.legend-swatch.p95 { background: rgba(88, 101, 242, 0.6); }
.legend-swatch.p99 { background: rgba(88, 101, 242, 0.35); }
.legend-swatch.ml { margin-left: 0.75rem; }

/* ─── Summary Table ───────────────────────────────────────────────────────── */
.bm-table-wrapper {
  margin-bottom: 2rem;
}

.bm-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}

.bm-scroll {
  overflow-x: auto;
}

.bm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.bm-table th {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 2px solid var(--vp-c-divider);
  white-space: nowrap;
}

.bm-table td {
  padding: 0.5rem 0.8rem;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  vertical-align: middle;
}

.bm-table tr:last-child td {
  border-bottom: none;
}

.bm-table tr.shardix-row {
  background: rgba(88, 101, 242, 0.04);
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-weight: 500;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-dot.shardix { background: #5865f2; }
.type-dot.raw { background: #718096; }

.badge {
  display: inline-block;
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
}

.badge.shardix {
  background: rgba(88, 101, 242, 0.15);
  color: #7983f5;
}

.badge.raw {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-3);
}

.highlight {
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.muted-cell {
  color: var(--vp-c-text-3);
}

/* ─── Overhead Analysis ───────────────────────────────────────────────────── */
.bm-analysis {
  margin-top: 0;
}

.bm-pairs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.bm-pair-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  transition: border-color 0.2s;
}

.bm-pair-card:hover {
  border-color: #5865f2;
}

.pair-lib {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.pair-stats {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.pair-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
}

.stat-label {
  color: var(--vp-c-text-3);
}

.stat-value.overhead {
  font-weight: 600;
  color: #f6ad55;
}

.stat-value.ratio {
  font-weight: 600;
  color: #68d391;
}

/* ─── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .bm-bar-row {
    grid-template-columns: 140px 1fr;
  }
  .latency-row {
    grid-template-columns: 140px 1fr;
  }
}
</style>
