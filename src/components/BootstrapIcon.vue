<template>
  <i :class="`bi bi-${name}`" />
</template>

<script>
export default {
  name: "BootstrapIcon",
  props: {
    name: { type: String, required: true },
  },
};
</script>
