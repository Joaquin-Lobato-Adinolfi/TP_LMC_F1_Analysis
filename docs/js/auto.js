/* Auto de F1 moderno (reglamento 2022) visto desde arriba, apuntando a la derecha.
   Dibujo propio en SVG. La plantilla también la usa presentacion/generar_presentacion.py,
   que reemplaza __C__ (color del equipo), __A__ (color de acento) e __ID__ (sufijo único). */
window.F1_AUTO_PLANTILLA = `<svg viewBox="0 0 260 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="cu__ID__" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
    <linearGradient id="go__ID__" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3d45"/><stop offset=".5" stop-color="#16171b"/><stop offset="1" stop-color="#2a2c33"/></linearGradient>
    <radialGradient id="ca__ID__" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="130" cy="52" rx="122" ry="40" fill="url(#ca__ID__)"/>
  <!-- piso -->
  <path d="M40 30 L70 22 L160 24 L196 36 L196 64 L160 76 L70 78 L40 70 Z" fill="#101114"/>
  <!-- suspensión -->
  <g stroke="#2b2d33" stroke-width="2.2" stroke-linecap="round">
    <path d="M58 16 L84 38 M58 84 L84 62 M56 16 L96 42 M56 84 L96 58"/>
    <path d="M186 16 L170 40 M186 84 L170 60 M188 16 L200 44 M188 84 L200 56"/>
  </g>
  <!-- gomas traseras y delanteras -->
  <g>
    <rect x="38" y="4" width="38" height="20" rx="6" fill="url(#go__ID__)"/><rect x="38" y="76" width="38" height="20" rx="6" fill="url(#go__ID__)"/>
    <rect x="170" y="6" width="32" height="17" rx="6" fill="url(#go__ID__)"/><rect x="170" y="77" width="32" height="17" rx="6" fill="url(#go__ID__)"/>
    <g stroke="#e8c341" stroke-width="1.4" opacity=".9"><path d="M44 8.5 h26 M44 91.5 h26 M175 10 h22 M175 90 h22"/></g>
  </g>
  <!-- alerón trasero -->
  <rect x="6" y="14" width="10" height="72" rx="2" fill="#15161a"/>
  <rect x="9" y="17" width="16" height="66" rx="3" fill="__C__"/>
  <rect x="9" y="17" width="16" height="66" rx="3" fill="url(#cu__ID__)"/>
  <rect x="20" y="20" width="4" height="60" rx="1" fill="#000" opacity=".35"/>
  <rect x="4" y="12" width="20" height="5" rx="1.5" fill="#1d1f24"/><rect x="4" y="83" width="20" height="5" rx="1.5" fill="#1d1f24"/>
  <!-- carrocería: pontones, cubierta de motor y morro -->
  <path d="M30 42 C 44 40, 56 34, 72 27 C 90 20, 116 20, 136 26 C 148 30, 156 36, 166 41
           L 214 45.5 C 226 46.5, 234 48, 236 50 C 234 52, 226 53.5, 214 54.5 L 166 59
           C 156 64, 148 70, 136 74 C 116 80, 90 80, 72 73 C 56 66, 44 60, 30 58 Z" fill="__C__"/>
  <path d="M30 42 C 44 40, 56 34, 72 27 C 90 20, 116 20, 136 26 C 148 30, 156 36, 166 41
           L 214 45.5 C 226 46.5, 234 48, 236 50 C 234 52, 226 53.5, 214 54.5 L 166 59
           C 156 64, 148 70, 136 74 C 116 80, 90 80, 72 73 C 56 66, 44 60, 30 58 Z" fill="url(#cu__ID__)"/>
  <!-- entradas de aire de los pontones -->
  <path d="M128 27 C 138 29, 146 33, 152 38 L 140 39 C 136 35, 132 31, 128 27 Z" fill="#07080a"/>
  <path d="M128 73 C 138 71, 146 67, 152 62 L 140 61 C 136 65, 132 69, 128 73 Z" fill="#07080a"/>
  <!-- franja de acento -->
  <path d="M40 48.2 L 214 48.8 L 214 51.2 L 40 51.8 Z" fill="__A__" opacity=".95"/>
  <path d="M84 30 C 100 26, 118 26, 130 30 L 126 33 C 114 30, 100 30, 86 33 Z" fill="__A__" opacity=".85"/>
  <path d="M84 70 C 100 74, 118 74, 130 70 L 126 67 C 114 70, 100 70, 86 67 Z" fill="__A__" opacity=".85"/>
  <!-- aleta de tiburón y toma de aire -->
  <path d="M34 47 L 104 46 L 104 54 L 34 53 Z" fill="#000" opacity=".22"/>
  <ellipse cx="108" cy="50" rx="9" ry="6" fill="#07080a"/>
  <!-- cockpit, halo y casco -->
  <path d="M118 42 C 128 40, 142 41, 150 45 L 150 55 C 142 59, 128 60, 118 58 Z" fill="#07080a"/>
  <circle cx="130" cy="50" r="6.5" fill="__A__"/>
  <path d="M126 46 a6.5 6.5 0 0 1 9 0" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
  <rect x="131" y="47.6" width="5" height="4.8" rx="1.6" fill="#0d0e11"/>
  <path d="M116 43 C 128 39, 146 40, 156 50 C 146 60, 128 61, 116 57" fill="none" stroke="#2c2e35" stroke-width="3" stroke-linecap="round"/>
  <path d="M156 50 L 166 50" stroke="#2c2e35" stroke-width="3" stroke-linecap="round"/>
  <!-- espejos -->
  <rect x="146" y="33" width="6" height="4" rx="1.5" fill="#1a1b20"/><rect x="146" y="63" width="6" height="4" rx="1.5" fill="#1a1b20"/>
  <!-- alerón delantero -->
  <path d="M226 8 H246 Q252 8 252 14 V86 Q252 92 246 92 H226 Q236 72 238 50 Q236 28 226 8 Z" fill="__C__"/>
  <path d="M226 8 H246 Q252 8 252 14 V86 Q252 92 246 92 H226 Q236 72 238 50 Q236 28 226 8 Z" fill="url(#cu__ID__)"/>
  <path d="M232 10 Q241 30 243 50 Q241 70 232 90" fill="none" stroke="#07080a" stroke-width="1.6" opacity=".65"/>
  <path d="M238 10 Q246 30 247 50 Q246 70 238 90" fill="none" stroke="__A__" stroke-width="1.5" opacity=".9"/>
  <rect x="224" y="5" width="26" height="4" rx="1.5" fill="#1d1f24"/><rect x="224" y="91" width="26" height="4" rx="1.5" fill="#1d1f24"/>
  <path d="M212 46 L 248 48.5 L 248 51.5 L 212 54 Z" fill="__C__"/>
</svg>`;

window.F1_AUTO = function (color, id, acento) {
  return window.F1_AUTO_PLANTILLA.replace(/__C__/g, color).replace(/__A__/g, acento || "#f5f6f8").replace(/__ID__/g, id);
};
