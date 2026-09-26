/* Componentes compartilhados: ícones, logo, header, menu mobile, footer e WhatsApp.
   Renderizados via JS para funcionar abrindo os arquivos direto do disco (file://). */
(function () {
  "use strict";
  var CFG = window.CESAMAR_CONFIG;
  var C = CFG.contato;
  var ROOT = document.body.getAttribute("data-root") || "";
  var PAGE = document.body.getAttribute("data-page") || "";

  /* ---------------- Ícones (traço 1.8, 24x24) ---------------- */
  var P = {
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/>',
    bag: '<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2M9 11v6M15 11v6"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/><circle cx="10.5" cy="12.5" r="0"/>',
    ship: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.4 17.4 21 12H3l1.8 5.4M12 12V4M8 8h8l-1-4H9z"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    pin: '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    x: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',
    badge: '<path d="M3.9 8.6a4 4 0 0 1 4.7-4.7 4 4 0 0 1 6.8 0 4 4 0 0 1 4.7 4.7 4 4 0 0 1 0 6.8 4 4 0 0 1-4.7 4.7 4 4 0 0 1-6.8 0 4 4 0 0 1-4.7-4.7 4 4 0 0 1 0-6.8"/><path d="m9 12 2 2 4-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2z"/>',
    sparkles: '<path d="M9.9 15.5A2 2 0 0 0 8.5 14l-6.1-1.6a.5.5 0 0 1 0-1L8.5 9.9A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z"/><path d="M20 3v4M22 5h-4"/>',
    landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    palm: '<path d="M13 8c0-2.8-2.2-5-5-5H7M13 7.9c1.9-1.9 5-2.3 7-.9M13 8c-2.8 0-5 2.2-5 5M13 8c2.3 0 4.3 1.4 5 3.5M12.5 8c.5 5-.5 10-2.5 13"/><path d="M5 21h10"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>',
    family: '<circle cx="7" cy="5" r="2.5"/><circle cx="17" cy="5" r="2.5"/><circle cx="12" cy="12" r="2"/><path d="M4 21v-6l-1-5h8l-1 5M20 21v-6l1-5h-8M10 21v-4h4v4"/>',
    whatsapp: '<path d="M3 21l1.7-5.2A8.9 8.9 0 1 1 8.3 19.4z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1.3-1.5-2-1-1 .8a4.5 4.5 0 0 1-2.6-2.6l.8-1-1-2z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
  };
  function icon(name, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || "") + ">" + (P[name] || "") + "</svg>";
  }

  /* ---------------- Logo (vetorizado da marca original) ---------------- */
  var RING = "M301.65,175.02 A63.4,63.4 0 0 1 175.04,172.81 M181.91,141.82 A63.4,63.4 0 0 1 299.03,152.06";
  var BIRD = "M228.1,185.8 228.2,186.4 229.6,186.6 230.5,187.6 231.4,187.5 232.1,186.4 232.0,185.2 230.9,184.9 229.4,185.0ZM220.0,175.4 219.2,176.0 219.5,176.8 223.5,180.8 223.5,181.5 218.6,185.9 218.0,187.4 218.0,188.9 219.2,190.6 220.8,191.4 222.1,191.6 224.2,191.2 226.4,190.2 227.2,188.8 226.1,188.2 223.2,189.5 221.6,189.6 220.8,189.2 220.1,188.1 220.9,186.6 225.2,182.9 225.6,180.8 224.4,178.8 221.4,175.8ZM220.5,168.1 220.6,169.1 230.2,178.6 237.5,184.5 238.8,185.0 240.0,186.5 248.0,191.6 254.0,194.2 261.1,196.1 270.4,197.1 276.5,197.1 283.1,196.4 287.4,195.5 289.4,194.2 289.2,193.1 288.4,192.6 281.1,193.8 276.6,193.8 272.8,193.0 271.6,192.2 271.5,191.8 272.0,191.1 274.8,189.5 279.1,185.1 280.1,183.4 280.0,182.1 279.2,181.5 277.6,181.6 271.9,184.9 266.8,186.9 265.9,186.1 269.2,181.8 269.8,180.1 269.1,179.5 265.8,179.8 255.0,183.5 251.5,184.0 245.4,183.6 241.1,182.5 235.9,179.8 229.4,175.0 227.1,173.9 221.9,168.0 221.0,167.6ZM269.6,167.0 268.9,167.5 267.0,170.4 266.1,173.0 267.1,172.6 269.0,170.4 269.8,168.6ZM207.5,157.0 207.4,157.9 210.2,159.9 217.4,165.9 218.1,165.8 218.1,164.4 214.0,160.6 212.1,159.6 209.2,156.9 208.0,156.6ZM174.1,154.5 174.1,155.4 175.1,155.5 175.2,154.8 174.9,154.4ZM325.4,153.1 324.6,152.1 321.1,151.0 315.0,154.4 310.9,156.0 305.0,157.0 292.9,157.4 283.9,158.5 276.8,160.9 272.1,163.9 271.6,165.1 272.1,165.9 272.8,166.0 275.2,164.6 277.9,164.1 283.2,164.2 289.6,165.5 293.8,167.2 301.0,169.5 304.5,169.8 307.2,169.2 310.6,167.9 311.4,167.2 311.4,166.5 309.6,166.0 304.9,166.0 304.1,165.5 304.5,164.8 312.5,164.5 316.5,163.6 320.0,161.4 320.0,159.2 317.5,159.1 314.2,160.1 308.2,161.1 303.5,161.2 303.1,161.0 303.4,160.5 313.1,158.8 321.1,156.8 324.5,155.2 325.2,154.4ZM196.5,150.2 195.9,151.8 196.4,155.9 198.1,159.0 198.2,160.4 197.5,162.0 194.8,164.9 192.2,168.4 192.0,170.4 192.8,172.5 197.8,178.5 203.8,183.2 205.4,183.2 206.4,182.2 212.0,183.1 217.8,183.0 218.0,182.0 216.9,181.0 210.5,179.6 204.1,176.5 199.5,172.4 197.6,169.8 197.1,168.4 197.2,166.5 199.4,162.6 200.4,159.1 198.0,155.5 198.0,152.9 197.2,151.6 197.1,150.4ZM149.8,158.4 150.6,159.2 159.2,160.2 171.5,163.8 173.5,165.0 178.0,166.5 182.8,169.2 183.8,169.5 184.2,168.9 184.1,167.6 181.5,165.9 170.1,161.0 167.6,157.4 163.8,153.2 164.4,152.6 168.5,152.4 170.0,151.9 170.2,150.5 169.6,150.0 167.9,150.5 162.5,150.9 155.9,153.0 152.9,155.0ZM202.0,150.1 202.1,150.9 202.8,151.4 213.4,151.0 222.4,152.0 248.6,158.1 262.4,160.0 264.8,161.5 266.1,163.6 266.1,166.6 264.2,168.5 264.4,170.2 265.1,169.8 269.5,162.9 274.9,157.8 274.1,156.8 271.5,157.2 257.8,157.5 256.2,156.8 249.0,155.6 246.6,155.6 243.4,154.4 235.1,152.5 219.4,149.6 208.5,149.5 206.4,150.0 202.5,149.8ZM192.2,146.8 191.5,146.1 190.2,146.0 185.2,147.8 173.4,147.8 171.0,148.9 170.6,149.8 171.1,150.1 173.6,149.6 185.0,149.8 191.2,147.9 192.1,147.4Z";
  var WORD = "M115.0,312.5 115.5,315.2 117.4,318.4 119.9,320.6 123.2,322.2 126.8,323.1 130.8,323.2 134.2,322.1 134.8,321.5 134.4,320.8 132.1,320.1 126.8,320.2 124.4,319.6 122.2,318.5 119.2,315.2 118.0,312.1 116.0,311.8ZM200.1,310.1 198.8,308.6 196.8,309.5 197.2,313.6 196.6,315.6 194.8,318.1 191.8,319.9 188.6,320.0 185.5,319.4 175.6,314.9 172.1,314.1 168.8,314.1 166.1,314.8 162.5,316.8 161.0,318.8 160.9,320.9 161.5,322.2 162.4,322.9 166.0,323.4 185.2,323.5 193.0,322.9 196.9,321.0 199.1,318.2 200.2,314.4ZM195.6,304.0 177.4,290.1 176.4,290.0 160.8,305.6 160.2,306.8 158.1,308.2 155.8,311.1 153.8,312.6 149.2,317.2 148.0,319.4 148.9,320.5 150.2,319.6 160.0,310.1 161.6,307.4 163.2,306.9 176.2,294.1 177.6,294.5 183.4,298.2 194.8,307.4 195.6,306.9ZM251.1,289.9 249.2,291.4 248.9,293.6 249.0,303.1 249.6,305.1 249.5,318.9 249.8,319.8 250.9,320.4 252.0,320.1 252.4,319.5 251.9,296.5 251.4,294.6 252.5,291.2ZM315.1,300.8 313.4,304.6 312.6,311.0 313.8,315.2 315.1,317.8 316.6,319.6 317.8,320.2 318.9,320.2 320.1,322.1 323.8,323.4 355.2,323.2 357.1,322.1 357.1,320.5 355.5,318.2 350.6,314.5 349.4,313.0 349.4,296.5 348.2,295.1 349.2,293.8 349.2,290.8 348.6,289.9 331.8,289.8 328.4,290.2 321.6,293.5 318.0,296.9 317.2,298.4ZM345.9,293.4 346.5,295.1 346.2,313.2 345.2,314.1 342.6,314.9 335.5,318.6 332.5,319.6 329.2,320.2 324.9,320.2 320.1,319.5 319.4,317.5 317.5,315.0 316.1,311.2 316.4,306.1 318.1,302.2 318.4,300.1 320.1,297.2 321.0,296.6 324.0,296.2 327.5,294.1 336.1,293.0 345.1,293.0ZM302.2,293.6 299.0,291.2 295.1,289.9 291.5,289.8 288.0,290.4 285.6,291.8 283.9,293.6 280.6,294.4 276.8,298.8 275.9,298.6 273.4,295.6 271.9,295.8 271.6,297.1 273.2,300.4 273.9,303.9 273.0,307.0 272.0,308.8 271.6,311.0 269.6,313.1 269.9,319.1 272.4,321.9 275.9,323.2 279.5,323.5 281.2,322.9 281.5,321.4 279.4,319.1 277.8,315.8 277.0,313.0 277.2,308.6 279.1,302.6 281.4,298.8 285.1,294.1 286.5,294.2 289.6,293.0 292.9,292.6 295.2,292.9 298.6,294.4 300.2,296.1 301.8,300.0 301.6,305.1 297.4,314.4 297.5,318.6 298.4,320.0 302.2,322.9 305.0,323.5 306.5,323.5 307.5,323.0 308.2,322.0 308.4,321.0 305.8,315.6 305.4,313.5 305.5,308.8 306.1,305.2 305.9,300.8 304.1,296.2ZM253.4,290.9 253.5,291.9 254.8,292.6 264.6,292.6 267.0,293.2 269.6,294.9 271.0,294.8 271.9,293.9 271.0,292.4 269.1,291.2 263.4,289.9 254.4,289.6ZM239.6,290.0 236.0,289.8 232.5,290.1 231.1,289.6 220.8,290.0 216.4,291.2 211.5,294.2 209.1,296.6 207.5,299.8 205.6,301.4 203.9,306.1 203.4,311.4 204.4,315.0 206.4,318.4 208.1,320.1 210.8,320.6 212.4,322.1 215.5,323.0 242.9,323.1 245.6,323.0 247.0,322.2 248.0,320.9 247.4,318.9 245.4,316.9 241.1,314.2 240.1,313.0 240.0,290.9ZM236.4,293.1 237.2,294.8 237.2,312.4 236.5,313.8 224.2,319.5 219.6,320.2 213.0,320.0 208.8,315.9 207.6,314.0 207.0,311.9 206.8,307.9 208.1,302.4 212.6,297.5 217.9,294.5 224.6,293.1ZM360.2,322.8 362.0,323.4 363.2,322.1 363.1,293.8 363.5,293.0 368.6,292.8 374.6,293.8 378.1,295.6 384.2,298.0 391.2,298.4 395.4,297.1 397.6,295.6 398.0,294.8 397.8,290.9 395.5,290.0 387.9,289.5 363.5,289.5 360.6,289.9 360.1,290.9ZM160.6,290.8 159.5,289.8 143.9,289.1 134.6,289.5 128.4,291.2 124.9,293.4 123.2,295.1 121.5,295.9 119.2,298.5 115.8,305.0 114.9,308.4 115.0,309.4 116.2,310.4 117.4,310.4 119.2,309.4 146.8,309.0 150.1,307.1 158.8,298.4 161.1,294.5ZM146.6,301.0 146.5,304.6 145.0,306.0 123.1,306.2 120.2,306.0 119.4,305.4 119.5,304.1 121.2,301.0 125.0,297.4 130.6,294.1 134.9,293.1 139.8,293.8 143.5,295.6 145.5,298.1ZM131.8,256.0 130.2,255.4 123.6,255.1 118.0,256.8 112.5,259.4 104.0,264.6 99.5,268.1 90.4,277.1 84.5,284.4 80.1,292.2 79.8,294.6 78.6,296.2 76.9,303.6 76.8,309.1 77.2,312.6 78.6,316.0 80.1,318.2 82.0,320.0 86.0,322.2 91.5,323.2 107.9,323.4 111.4,322.6 112.4,322.0 113.1,319.1 110.1,316.1 107.1,315.1 95.9,314.1 92.1,312.5 89.6,310.1 88.2,307.4 87.2,303.4 87.4,296.9 88.2,293.1 90.6,287.6 95.4,280.6 98.1,277.6 104.0,272.5 109.9,269.2 114.1,268.1 117.2,268.4 119.5,269.9 120.4,271.8 120.8,275.2 121.8,276.9 124.2,277.5 125.6,277.1 127.2,276.0 130.6,271.9 132.8,267.6 133.9,264.0 133.6,259.0Z";
  function logoMark() {
    return '<svg class="mark" viewBox="146 102 186 136" aria-hidden="true"><path d="' + RING + '" fill="none" stroke="#E03C3C" stroke-width="3.8" stroke-linecap="round"/><path class="bird" fill-rule="evenodd" d="' + BIRD + '"/></svg>';
  }
  function logoWord() {
    return '<svg class="word" viewBox="76 254 323 70" aria-hidden="true"><path fill-rule="evenodd" d="' + WORD + '"/></svg>';
  }
  function brand() {
    return '<a class="brand" href="' + ROOT + 'index.html" aria-label="Cesamar Turismo — página inicial">' + logoMark() + logoWord() + "</a>";
  }

  var NAV = [
    ["ofertas", "Ofertas", "pages/ofertas.html"],
    ["destinos-nacionais", "Destinos nacionais", "pages/destinos-nacionais.html"],
    ["destinos-internacionais", "Destinos internacionais", "pages/destinos-internacionais.html"],
    ["cruzeiros", "Cruzeiros", "pages/cruzeiros.html"],
    ["programar-viagem", "Planeje seu sonho", "pages/programar-viagem.html"],
    ["quem-somos", "Quem somos", "pages/quem-somos.html"],
    ["contato", "Contato", "pages/contato.html"]
  ];
  var ST = window.Cesamar && window.Cesamar.store;

  /* WhatsApp: número e mensagem vêm do painel (store); config.js é só o valor inicial */
  function waLink(msg) {
    if (ST) return ST.linkWhatsGeral(msg);
    return "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg || "Olá! Vim pelo site da Cesamar e quero falar com um consultor.");
  }
  function waTexto() {
    var n = ST ? String(ST.carregar().config.whatsappNumero || "") : C.whatsapp;
    n = n.replace(/\D/g, "").replace(/^55/, "");
    return n.length >= 10 ? "(" + n.slice(0, 2) + ") " + n.slice(2, n.length - 4) + "-" + n.slice(-4) : C.whatsappTexto;
  }

  /* Mega-menu de Ofertas: destinos monitorados por região + categorias (campanhas) */
  function megaMenu() {
    if (!ST) return "";
    var db = ST.carregar();
    var grupos = [["Europa", ["Europa"]], ["Américas", ["América do Norte", "América Central", "América do Sul"]], ["Ásia, África e Oriente Médio", ["Ásia", "Oriente Médio", "África"]]];
    function lista(regs) {
      return db.destinos.filter(function (d) { return d.ativo && regs.indexOf(d.regiao) >= 0; }).map(function (d) {
        var tem = ST.publicadas().some(function (o) { return o.destinoId === d.id; });
        return '<li><a href="' + ROOT + 'pages/ofertas.html?destino=' + d.id + '">' + (d.nomeExibicao || d.nome) + "<small>" + d.cidade + (tem ? " · com oferta" : "") + "</small></a></li>";
      }).join("");
    }
    var feat = ST.publicadas().sort(function (a, b) { return a.preco.precoParcelado - b.preco.precoParcelado; })[0];
    var fd = feat && ST.destino(feat.destinoId), fi = feat && ST.imagemPrincipal(feat.destinoId);
    return '<div class="mega" role="region" aria-label="Ofertas"><div class="wrap mega-grid">' +
      grupos.map(function (g, i) { return "<div><p class=\"mega-h\">" + g[0] + "</p><ul" + (i === 0 ? ' class="cols2"' : "") + ">" + lista(g[1]) + "</ul></div>"; }).join("") +
      (feat ? '<a class="mega-feat" href="' + ROOT + 'pages/oferta.html?codigo=' + feat.codigo + '"><img src="' + ROOT + fi.url + '" alt=""><span><small>Oportunidade da semana</small><b>' + feat.titulo + "</b>A partir de " + window.Cesamar.precos.brl(feat.preco.precoParcelado) + " ou " + feat.preco.parcelas + "x de " + window.Cesamar.precos.brl(feat.preco.valorParcela) + "</span></a>" : "") +
      '</div><div class="wrap mega-foot"><span class="mega-h" style="margin:0">Categorias</span>' +
      ST.campanhasAtivas().map(function (c) { return '<a href="' + ROOT + 'pages/ofertas.html?categoria=' + c.id + '">' + c.nome + "</a>"; }).join("") +
      '<a class="link-arrow" href="' + ROOT + 'pages/ofertas.html">Todas as ofertas ' + icon("arrow") + "</a></div></div>";
  }

  function header() {
    var links = NAV.map(function (n) {
      var a = '<a href="' + ROOT + n[2] + '"' + (PAGE === n[0] ? ' aria-current="page"' : "") + (n[0] === "ofertas" ? ' class="has-mega" aria-haspopup="true"' : "") + ">" + n[1] + "</a>";
      return n[0] === "ofertas" ? '<div class="nav-item">' + a + megaMenu() + "</div>" : a;
    }).join("");
    return '<a class="skip" href="#conteudo">Pular para o conteúdo</a>' +
      (CFG.prototipo ? '<div class="proto-bar"><b>Site em implantação</b> · ofertas automáticas identificadas; tarifas devem ser confirmadas na fonte</div>' : "") +
      '<header class="site-header"><div class="wrap">' + brand() +
      '<nav class="nav" aria-label="Principal">' + links + "</nav>" +
      languageSwitcher() +
      '<div class="header-cta"><a class="btn btn--sm btn--ghost equipe-login" href="' + ROOT + 'retaguarda/index.html">Login da equipe</a><a class="fav-link" href="' + ROOT + 'pages/pacotes.html?favoritos=1" aria-label="Meus favoritos">' + icon("heart") + '<span class="fav-count" hidden>0</span></a><a class="btn btn--sm btn--wa" href="' + waLink() + '" target="_blank" rel="noopener" data-wa-geral>' + icon("whatsapp") + 'Falar com um consultor</a></div>' +
      '<button class="menu-btn" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-nav"><span></span></button>' +
      "</div></header>" +
      '<nav class="mobile-nav" id="mobile-nav" aria-label="Menu">' +
      '<a href="' + ROOT + 'index.html">Início</a>' + NAV.map(function (n) { return '<a href="' + ROOT + n[2] + '">' + n[1] + "</a>"; }).join("") +
      '<a href="' + ROOT + 'retaguarda/index.html">Login da equipe</a>' +
      '<a class="btn btn--wa" href="' + waLink() + '" target="_blank" rel="noopener">' + icon("whatsapp") + "Falar no WhatsApp</a></nav>";
  }

  function languageSwitcher() {
    var atual = window.location.href;
    var langs = [["pt-BR", "Brasil", "br"], ["en", "English (USA)", "us"], ["es", "Español", "es"], ["fr", "Français", "fr"], ["pt-PT", "Português (Portugal)", "pt"]];
    function href(codigo) { return codigo === "pt-BR" ? atual : "https://translate.google.com/translate?sl=pt&tl=" + encodeURIComponent(codigo) + "&u=" + encodeURIComponent(atual); }
    function flag(sigla, alt) { return '<img src="' + ROOT + 'assets/img/flags/' + sigla + '.svg" alt="' + alt + '">'; }
    return '<details class="lang-switcher"><summary aria-label="Selecionar idioma">' + flag("br", "Brasil") + '<span>PT-BR</span></summary><div class="lang-menu">' +
      langs.map(function (l) { return '<a href="' + href(l[0]) + '"' + (l[0] === "pt-BR" ? ' aria-current="true"' : ' target="_blank" rel="noopener"') + '>' + flag(l[2], l[1]) + '<span>' + l[1] + '</span></a>'; }).join("") + '</div></details>';
  }

  function footer() {
    var E = CFG.empresa;
    return '<footer class="site-footer"><div class="wrap"><div class="foot-grid">' +
      "<div>" + brand() +
      '<p style="margin-top:22px;max-width:34ch">Viagens sob medida, com consultores especializados e suporte do embarque ao retorno. Há ' + E.fundacaoTexto + " no Centro do Rio.</p>" +
      '<div class="social"><a href="https://instagram.com/' + C.instagram + '" target="_blank" rel="noopener" aria-label="Instagram">' + icon("instagram") + '</a><a href="' + waLink() + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon("whatsapp") + '</a><a href="mailto:' + C.email + '" aria-label="E-mail">' + icon("mail") + "</a></div></div>" +
      "<div><h4>Explore</h4><ul>" + NAV.slice(0, 4).concat([["servicos", "Serviços", "pages/servicos.html"]]).map(function (n) { return '<li><a href="' + ROOT + n[2] + '">' + n[1] + "</a></li>"; }).join("") + "</ul></div>" +
      '<div><h4>A agência</h4><ul><li><a href="' + ROOT + 'pages/quem-somos.html">Quem somos</a></li><li><a href="' + ROOT + 'pages/contato.html">Contato</a></li><li><a href="' + ROOT + 'retaguarda/index.html">Área da equipe</a></li></ul></div>' +
      "<div><h4>Fale com a gente</h4><ul>" +
      '<li><a href="tel:' + C.telefoneLink + '">' + C.telefone + "</a></li>" +
      '<li><a href="' + waLink() + '" target="_blank" rel="noopener">WhatsApp ' + waTexto() + "</a></li>" +
      '<li><a href="mailto:' + C.email + '">' + C.email + "</a></li>" +
      '<li><a href="' + C.mapsUrl + '" target="_blank" rel="noopener">' + C.endereco + "<br>" + C.bairroCidade + "</a></li>" +
      (C.horario ? "<li>" + C.horario + "</li>" : "") + "</ul></div>" +
      "</div>" +
      '<div class="foot-legal"><span>© ' + new Date().getFullYear() + " " + E.razaoSocial + " · CNPJ " + E.cnpj + "</span><span>Cadastur " + E.cadastur + " · Embratur " + E.embratur + "</span></div>" +
      "</div>" + giantWord() + "</footer>" +
      '<a class="wa-float" href="' + waLink() + '" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">' + icon("whatsapp", ' style="stroke-width:1.6"') + '<span class="tip">Falar com um consultor</span></a>' +
      '<div class="toast" role="status" aria-live="polite"></div>';
  }


  function creds() {
    var E = CFG.empresa;
    return [["badge", "Cadastur", E.cadastur + " · válido até " + E.cadasturValidade], ["award", "Embratur", E.embratur], ["landmark", "CNPJ", E.cnpj], ["pin", "Sede", C.endereco]]
      .map(function (c) { return '<div class="cred"><span class="ico">' + icon(c[0]) + "</span><div><small>" + c[1] + "</small><b>" + c[2] + "</b></div></div>"; }).join("");
  }
  function mapa() {
    // Mapa ilustrado (não depende de internet). Linhas aproximadas, sem escala.
    var ruas = "";
    for (var i = 0; i < 9; i++) ruas += '<path d="M' + (-40 + i * 70) + ' 420 L' + (160 + i * 70) + ' -20" stroke="#fff" stroke-width="7" opacity=".75"/>';
    for (var j = 0; j < 7; j++) ruas += '<path d="M-20 ' + (60 + j * 62) + ' L520 ' + (10 + j * 62) + '" stroke="#fff" stroke-width="5" opacity=".6"/>';
    return '<div class="map-card"><svg viewBox="0 0 700 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="700" height="420" fill="#ece6f4"/>' + ruas +
      '<path d="M520 -10 C560 60 540 140 590 200 C640 260 610 340 660 430 L720 430 L720 -10Z" fill="#9fc3e3"/>' +
      '<path d="M520 -10 C560 60 540 140 590 200 C640 260 610 340 660 430" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>' +
      '<path d="M140 430 L470 -10" stroke="#f7b26b" stroke-width="16" stroke-linecap="round"/>' +
      '<text x="330" y="150" transform="rotate(-53 330 150)" font-size="13" font-family="Poppins,sans-serif" font-weight="600" fill="#6b4a1f">AV. RIO BRANCO</text>' +
      '<circle cx="470" cy="40" r="26" fill="#cfe3c4"/><text x="430" y="86" font-size="11" font-family="Poppins,sans-serif" fill="#3d4a3a">Praça Mauá</text>' +
      '<text x="610" y="120" font-size="12" font-family="Poppins,sans-serif" fill="#2d5a7c" font-style="italic">Baía de</text><text x="600" y="136" font-size="12" font-family="Poppins,sans-serif" fill="#2d5a7c" font-style="italic">Guanabara</text>' +
      '<circle cx="350" cy="210" r="34" fill="#e03c3c" opacity=".18"><animate attributeName="r" values="18;40;18" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".35;0;.35" dur="2.6s" repeatCount="indefinite"/></circle>' +
      '<path d="M350 214 c-14 -16 -22 -26 -22 -38 a22 22 0 0 1 44 0 c0 12 -8 22 -22 38z" fill="#e03c3c"/><circle cx="350" cy="176" r="8" fill="#fff"/>' +
      '</svg><div class="pin-label" style="top:40%">Cesamar · ' + C.endereco + "</div>" +
      '<div class="map-actions"><a class="btn btn--ink btn--sm" href="' + C.mapsUrl + '" target="_blank" rel="noopener">' + icon("pin") + 'Abrir no Google Maps</a><a class="btn btn--light btn--sm" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(C.endereco + ", " + C.bairroCidade) + '" target="_blank" rel="noopener">Como chegar</a></div></div>';
  }

  function giantWord() {
    return '<div class="foot-signature" aria-hidden="true"><svg viewBox="76 254 323 70"><path fill-rule="evenodd" d="' + WORD + '"/></svg></div>';
  }
  function divider() {
    return '<div class="sig-divider" aria-hidden="true"><i></i>' + logoMark() + "<i></i></div>";
  }
  function intro() {
    var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var visto = false; try { visto = sessionStorage.getItem("cesamar.intro") === "1"; sessionStorage.setItem("cesamar.intro", "1"); } catch (e) { }
    if (reduz || visto || PAGE !== "home") return "";
    return '<div class="intro" aria-hidden="true"><div class="intro-in">' +
      '<svg class="intro-mark" viewBox="146 102 186 136"><path class="ring" pathLength="1" d="' + RING + '" fill="none" stroke="#E03C3C" stroke-width="3.8" stroke-linecap="round"/><path class="bird" fill-rule="evenodd" d="' + BIRD + '"/></svg>' +
      '<svg class="intro-word" viewBox="76 254 323 70"><path fill-rule="evenodd" d="' + WORD + '"/></svg>' +
      '<p class="intro-tag">Viagens e Turismo · há mais de 30 anos</p></div></div>';
  }

  /* ---------------- Montagem ---------------- */
  document.documentElement.classList.remove("no-js");
  if (CFG.prototipo) document.body.classList.add("proto");
  var h = document.getElementById("site-header"); if (h) h.outerHTML = intro() + header();
  var introEl = document.querySelector(".intro");
  if (introEl) { document.body.classList.add("intro-on"); setTimeout(function () { introEl.classList.add("out"); document.body.classList.remove("intro-on"); }, 2300); setTimeout(function () { introEl.remove(); }, 3200); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-sig-divider]"), function (el) { el.outerHTML = divider(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-creds]"), function (el) { el.innerHTML = creds(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-map]"), function (el) { el.outerHTML = mapa(); });
  Array.prototype.forEach.call(document.querySelectorAll("a[data-wa-geral]"), function (el) { el.href = waLink(); el.target = "_blank"; el.rel = "noopener"; });
  Array.prototype.forEach.call(document.querySelectorAll("a[data-wa]"), function (el) { el.href = waLink(); el.target = "_blank"; el.rel = "noopener"; el.insertAdjacentHTML("afterbegin", icon("whatsapp")); });

  // Roteamento de atendimento e formulário de contingência, disponíveis em todas as páginas.
  var atendimento = document.createElement("script");
  atendimento.src = ROOT + "assets/js/atendimento.js";
  atendimento.defer = true;
  document.body.appendChild(atendimento);
  Array.prototype.forEach.call(document.querySelectorAll("[data-stamp-mark]"), function (el) { el.innerHTML = logoMark(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-contatos]"), function (el) {
    el.innerHTML =
      '<li><span class="ico">' + icon("whatsapp") + '</span><a href="' + waLink() + '" target="_blank" rel="noopener"><small>WhatsApp</small>' + waTexto() + "</a></li>" +
      '<li><span class="ico">' + icon("phone") + '</span><a href="tel:' + C.telefoneLink + '"><small>Telefone</small>' + C.telefone + "</a></li>" +
      '<li><span class="ico">' + icon("mail") + '</span><a href="mailto:' + C.email + '"><small>E-mail</small>' + C.email + "</a></li>" +
      '<li><span class="ico">' + icon("pin") + '</span><a href="' + C.mapsUrl + '" target="_blank" rel="noopener"><small>Visite a agência</small>' + C.endereco + ", " + C.bairroCidade + "</a></li>" +
      (C.horario ? '<li><span class="ico">' + icon("clock") + "</span><span><small>Horário</small>" + C.horario + "</span></li>" : "");
  });
  var f = document.getElementById("site-footer"); if (f) f.outerHTML = footer();

  window.Cesamar = window.Cesamar || {};
  window.Cesamar.icon = icon;
  window.Cesamar.waLink = waLink;
  window.Cesamar.logoMark = logoMark;
  window.Cesamar.ROOT = ROOT;
  window.Cesamar.divider = divider;
  // favicon com a marca
  if (!document.querySelector("link[rel=icon]")) { var l = document.createElement("link"); l.rel = "icon"; l.type = "image/svg+xml"; l.href = ROOT + "assets/img/logo/favicon.svg"; document.head.appendChild(l); }
})();
