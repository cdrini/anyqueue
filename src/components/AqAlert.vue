<template>
  <div v-if="show" class="alert" :class="`alert-${variant}`" role="alert">
    <slot />
  </div>
</template>

<script>
export default {
  name: "AqAlert",
  props: {
    show: {
      type: Boolean,
      default: true,
    },
    variant: {
      type: String,
      default: "primary",
    },
  },
};
</script>
