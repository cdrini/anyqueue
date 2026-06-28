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

<style scoped>
.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 1rem;
  line-height: 1.5;
}

.alert-primary   { color: #084298; background-color: #cfe2ff; border-color: #9ec5fe; }
.alert-secondary { color: #41464b; background-color: #e2e3e5; border-color: #c4c8cb; }
.alert-success   { color: #0f5132; background-color: #d1e7dd; border-color: #a3cfbb; }
.alert-danger    { color: #842029; background-color: #f8d7da; border-color: #f1aeb5; }
.alert-warning   { color: #664d03; background-color: #fff3cd; border-color: #ffecb5; }
.alert-info      { color: #055160; background-color: #cff4fc; border-color: #9eeaf9; }
.alert-light     { color: #636464; background-color: #fefefe; border-color: #fdfdfe; }
.alert-dark      { color: #141619; background-color: #d3d3d4; border-color: #bcbebf; }
</style>
