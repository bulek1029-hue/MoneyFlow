# PC Game Web — iOS

Browserowy frontend przygotowany pod GitHub Pages, Safari i dotykowe sterowanie.

## Ważne

Ten repozytorium **nie zawiera gier ani BIOS-ów**. Użytkownik wskazuje własne, legalnie posiadane pliki.

### KOTOR 2

KOTOR 2 jest klasyczną grą Windows, a nie DOS. Zwykły DOSBox/js-dos nie wystarczy. Obecnie istnieją eksperymentalne rozwiązania uruchamiania części 32-bitowych aplikacji Windows w WebAssembly, ale kompatybilność z konkretną grą nie jest gwarantowana.

Projekt ma już gotowy:
- interfejs pod iPhone,
- fullscreen,
- touchpad,
- wirtualny joystick,
- przyciski ekranowe,
- wybór lokalnych plików,
- PWA manifest,
- strukturę pod GitHub Pages.

## GitHub Pages

1. Utwórz nowe repozytorium.
2. Wgraj wszystkie pliki z tego folderu do głównego katalogu repo.
3. Wejdź w **Settings → Pages**.
4. Wybierz **Deploy from a branch**.
5. Branch: `main`, folder: `/ (root)`.
6. Zapisz.
7. Otwórz adres GitHub Pages w Safari.

## Następny etap

Do pełnego uruchamiania gier Windows trzeba podłączyć właściwy runtime WASM/Win32. Frontend jest przygotowany tak, aby można było go do niego podpiąć bez przebudowy sterowania.

Źródło technologiczne dla klasycznych gier DOS: js-dos / DOSBox.
