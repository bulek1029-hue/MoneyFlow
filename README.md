# PC Game Web V4 — Game Launcher

Ta wersja jest launcherem dla legalnie posiadanych gier Windows.

## Jak działa
1. Wybierasz lokalny ZIP gry.
2. Launcher pokazuje go w bibliotece.
3. Klikasz START.
4. Otwiera się oficjalny player wemu.
5. W wemu wybierasz ten sam ZIP i właściwy EXE.

Przeglądarka nie pozwala naszej stronie przekazać bezpośrednio lokalnego pliku do obcej domeny bez jej API, dlatego nie udajemy automatycznej integracji. To jest celowe i bezpieczne ograniczenie przeglądarki.

wemu oficjalnie opisuje obsługę lokalnych ZIP-ów, Mobile Safari/iOS i uruchamianie bez uploadu do chmury.

## GitHub Pages
Podmień pliki w repozytorium:
index.html
app.js
style.css
manifest.webmanifest
.nojekyll
README.md

Pliki muszą być w głównym katalogu `main`.

Nie wrzucaj gier ani ich plików do GitHub.
