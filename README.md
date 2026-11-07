# Rastreador de Episodios · Black Clover

Página para encontrar **el episodio exacto** de cualquier momento de Black Clover sin pelearte con Google.
Escribes «noelle valquiria», «asta demonio» o «muerte de julius» y te dice el número.

## Qué tiene

- **Buscar**: escribe el momento y sale el episodio, con imagen, capítulo del manga, quién sale y vídeo si lo hay.
- **Momentos**: transformaciones, peleas, revelaciones y sucesos clave, filtrables por tipo, personaje, arco, temporada y «solo con vídeo».
- **Peleas**: todos los combates de la wiki con los episodios que dura cada uno.
- **Episodios**: los 175 episodios, filtrables por quién sale, arco, temporada y si son relleno.
- **Personajes**: ficha de cada uno con su cronología, sus peleas y una línea temporal de cuándo sale.

## Cómo abrirla

Necesitas [Node.js](https://nodejs.org).

```
abrir.cmd
```

o, en cualquier sistema:

```
node servidor.mjs
```

y abre <http://localhost:5517>. Servida así, los vídeos de YouTube se reproducen dentro de la página
(si abres `index.html` como archivo, funciona igual pero los vídeos se abren en YouTube).

## Actualizar con episodios nuevos

```
node actualizar.mjs
```

Baja los episodios de la [wiki de Black Clover](https://blackclover.fandom.com) y regenera `datos-episodios.js`
(episodios, peleas, hechizos que debutan, personajes que salen, imágenes y retratos).
La primera vez descarga todos los episodios; después solo los nuevos.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html`, `estilo.css`, `app.js` | La página |
| `momentos.js` | Momentos clave escritos a mano (episodio, capítulo, personajes, vídeo) |
| `datos-episodios.js` | Datos generados desde la wiki (no editar a mano) |
| `actualizar.mjs` | Descarga la wiki y regenera los datos |
| `servidor.mjs`, `abrir.cmd` | Servidor local en el puerto 5517 |

Los números de episodio salen de las referencias capítulo ↔ episodio de la wiki. Imágenes de la wiki de Black Clover
y vídeos oficiales de Crunchyroll en YouTube. Black Clover es obra de Yūki Tabata; proyecto de uso personal sin ánimo de lucro.
