<template>
<svg
   xmlns="http://www.w3.org/2000/svg"
   width="64"
   height="64"
   viewBox="0 0 16.933333 16.933333"
   version="1.1">
  <g>
    <g transform="matrix(0.91836535,0.53662532,-0.53662532,0.91836535,3.522845,-1.3023333)">
        <path
          style="fill:#61a3ff;stroke:#61a3ff;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1, 1"
          d="M 5.8208333,8.4666667 2.7847826,3.208073 l 6.0721011,0 z"
          />
      </g>
      <g transform="matrix(0.72991387,0.43822267,-0.42650811,0.74996185,3.9614752,5.0877095)">
        <path
          style="fill:#41a1e1;stroke:#41a1e1;stroke-width:2.28077;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:2.28077, 2.28077"
          d="M 5.8208333,8.4666667 2.7847826,3.208073 l 6.0721011,0 z"
          />
      </g>
      <g transform="matrix(0.6814394,0.41010655,-0.39818318,0.70184473,8.4627075,3.0454817)">
        <path
          style="fill:#2a77d4;stroke:#2a77d4;stroke-width:2.61146;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:2.61146, 2.61146"
          d="M 5.8208333,8.4666667 2.7847826,3.208073 l 6.0721011,0 z"
          />
      </g>
  </g>
</svg>
</template>

<style scoped>
@keyframes rotate {
  0% {
    rotate: 0deg;
  }
  33%, 100% {
    rotate: 360deg;
  }
}

svg g {
  opacity: 0.8;
  mix-blend-mode: multiply;
}

svg path {
  transform-origin: center;
  transform-box: fill-box;
  animation: rotate 1.5s ease-in-out infinite;
}
</style>