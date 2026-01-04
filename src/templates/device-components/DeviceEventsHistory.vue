<template>
  <div class="events-section">
    <!-- Events Title -->
    <div class="subtitle">
      <i class="fas fa-calendar-check"></i> {{ KT('device.historyEvents') }}
    </div>

    <!-- Events Container -->
    <div class="events-container">
      <div class="event-list-container">
        <!-- Event List -->
        <div v-for="event in events" :key="event.id || `${event.type}:${event.eventTime}:${event.deviceId}`" class="event-item">
          <!-- Date and Time Details -->
          <div class="event-date">
            <div class="event-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="event-datetime">
              {{ formatDate(event.eventTime) }}<br>
              {{ formatTime(event.eventTime) }}
            </div>
          </div>
          <!-- Alarm or Notification -->
          <div v-if="event.type === 'alarm'" class="event-text">
            {{ KT("alarms." + event.attributes['alarm']) }}
          </div>
          <div v-else class="event-text">
            {{ KT("notification.types." + event.type) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import KT from '../../tarkan/func/kt.js';

defineProps({
  events: {
    type: Array,
    default: () => []
  }
});

const formatDate = (dateTime) => {
  return new Date(dateTime).toLocaleDateString();
};

const formatTime = (dateTime) => {
  return new Date(dateTime).toLocaleTimeString();
};
</script>

<style scoped>
.events-section {
  width: 100%;
}

.subtitle {
  padding: 7px 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  text-transform: uppercase;
  font-size: 11px;
  color: var(--el-text-color-regular);
}

.events-container {
  padding: 10px;
}

.event-list-container {
  max-height: 200px;
  overflow-y: auto;
}

.event-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 10px;
}

.event-item:last-child {
  border-bottom: none;
}

.event-date {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.event-icon {
  color: var(--el-color-warning);
  font-size: 14px;
}

.event-datetime {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.3;
}

.event-text {
  flex: 1;
  font-size: 12px;
  color: var(--el-text-color-primary);
}
</style>
