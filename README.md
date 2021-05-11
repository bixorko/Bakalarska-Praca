# Bakalárska práca
# Bezpečnostná kamera založená na Raspberry Pi
## Autor: Peter Vinarčík
## Vedúci: Ing. Zdeněk Materna, Ph.D.

Výsledok práce poskytuje možnosť vytvorenia bezpečnostnej kamery založenej na Raspberry Pi, pričom použité komponenty sú Raspberry Pi a Waveshare Raspberry Pi Camera (M), ktorá je typu rybie oko a zaberá priestor o veľkosti 200 stupňov.

Fish-eye obraz je pomocou prvkov počítačového videnia, konkrétne knižnice OpenCV pre Python, spracovaný formou korekcie skreslenia, kedy je z fish-eye obrazu odstránené radiačné skreslenie. Následne je možné sa po obraze pohybovať pomocou požiadaviek smerujúcich zo sieťového nahrávacieho zariadenia Shinobi na ONVIF Media Servis prebratý z RPOS (Raspberry Pi ONVIF Server), ktorý požiadavku na pohyb kamery spracuje a následne pomocou Node.js a Pythonu odošle pomocou stdin pipeline Node.js správu o pohybe, ktorú Pythonovský skript spracuje a vykoná pohyb podľa používateľa.

Takýto pohyb následne simuluje pan-tilt-zoom mechanizmus kamery, kedy sa javí, že kamera je "v pohybe" pomocou pan-tilt-zoom mechanizmu, avšak v skutočnosti je kamera uložená na statickom mieste a jej pohyb je len simulovaný.

### Nutné predinštalované závislosti:
+ Celková implementácia počíta s predinštalovanou knižnicou OpenCV.
+ Možnou variantou je napríklad nainštalovanie OpenCV 4.5.0 pomocou návodu https://qengineering.eu/install-opencv-4.5-on-raspberry-pi-4.html
+ Alternatívne je možnosť použiť inštalačný návod nachádzajúci sa v texte bakalárskej práce v kapitole Implementácia (7).

### Spustenie:
Po naklonovaní repozitára pomocou príkazu
+ git clone https://www.github.com/bixorko/Bakalarska-praca
+ alebo získaní zdrojových súborov z priloženého pamäťového média
+ je nutné spustiť shellovský skript configure.sh, ktorý predinštaluje zvyšné potrebné závislosti (mimo OpenCV - kvôli veľkosti a zložitosti inštalácie), implicitne nainštaluje sieťové nahrávacie zariadenie Shinobi a spustí kameru na adrese: rtsp://<usernameConfig>:<passwordConfig>@RPiIP:8554/onvif1.
+ V prípade prvého spustenia je následne nutné vstúpiť do superadministrácie Shinobi pomocou URL http://RPiIP:8080/super, kde je nutné vytvoriť používateľa, pomocou ktorého bude možné pristupovať ku kamere (kamerám).
+ V prípade, že po príchode na danú URL je prístup odmietnutý a Shinobi vyhadzuje chybu, je nutné nasledovať body v prílohe A.1
+ Alternatívne je možné túto chybu vyriešiť pomocou oficiálneho Shinobi článku: https://hub.shinobi.video/articles/view/sIuhLW2A0E8A7K3
+ Po vytvorení užívateľského konta je nutné presmerovanie na adresu http://RPiIP:8080/ kde sa následne dá prihlásiť pod novovytvoreným účtom.
+ Potom je nutné kliknúť na symbol + nachádzajúci sa v ľavom hornom rohu a pokračovať následovne:
+ Options
+ Import
+ Upload File
+ Zvoliť v priečinku rpos - shinobiCameraSettings.json
+ Load
+ Následne je možné kameru bezproblémovo ovládať z NVR Shinobi.

### Detekcia tváre
+ Detekciu tváre v obraze je možné spustiť pomocou modifikácie prepínača v Bakalarska-praca/rpos/python/launch.sh a to dopísaním prepínača -f / --face na koniec súboru.
+ Po zapnutí tejto funkcie však nie je garantovaná stabilita vysielania - viď. demonštračné videá.

### Zdroje
+ Veľká časť kódu bola prebratá, inšpirovaná, prípadne modifikovaná z open-sourceovej knižnice RPOS - https://github.com/BreeeZe/rpos, ktorá je odporúčaná priamo ONVIFom. [https://www.onvif.org/resources/]