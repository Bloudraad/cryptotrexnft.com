document.addEventListener('DOMContentLoaded', () => {
  const vxViewer = document.querySelector('#preview .voxel-viewer');
  vxViewer.style.height = vxViewer.offsetWidth;
  window.addEventListener('resize', () => {
    vxViewer.style.height = vxViewer.offsetWidth;
  });
});
