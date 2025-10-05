# Schnell-Tagger

Vielleicht etwas altmodisch, aber die Webanwendung dient dazu, Stichwörter bzw. Tags in JPEG-Bildern schnell und einfach zu verwalten: lesen, schreiben und löschen. Sie modifiziert dafür die IPTC-Header der Bilder (nicht aber die Exif- oder XMP-Header). Zum Betrieb sind ein Webserver und PHP erforderlich. Ich habe mit XAMPP 8.2.12 unter Win 11 gearbeitet. 

Über die Weboberfläche lassen sich nur die IPTC-Stichwörter ändern, über die die Datei *felder.ini* jedoch **alle IPTC-Felder**.  

![Oberfläche Schnell-Tagger](./screen.png)

## Wichtige Infos vorweg

* Die Anwendung ist für einen lokalen und **nicht für den Einsatz im öffentlichen Netz gedacht**
    1. Es gibt **keine ausreichenden Sicherheitsprüfungen** in den PHP-Skripten
    2. Die Anwendung lädt alle **Bilder komplett und unkomprimiert**, was für den Betrieb über das Internet ungeeignet ist.
* Wenn der Schreibprozess gestört wird, können Bilder kaputt gehen. **Es empfiehlt sich, die Funktion für Sicherheitskopien zu verwenden** (was auch die Voreinstellung ist). Sie kopiert die Bilder vor dem Schreiben des Headers.
* Im Folgenden spreche ich von der JavaScript-Datei *script.js*. Wer TypeScript einsetzt, ändert die Konfiguration in *script.ts* und kompiliert diese. 

## Spezifizierung

* Läuft in allen modernen Browsern
* Entwickelt mit XAMPP 8.2.12 für Windows
* Kompiliert mit `tsc -target es2021`
* Zum Lesen der IPTC-Tags dient der PHP-Befehl `$sizgetimagesize()`
* Zum Schreiben `iptcembed()`
* Schreibt über die Datei *felder.ini* sämtliche IPTC-Felder, laut Standard.

## Basis-Funktionen

* Im linken Fenster blättert man durch die Verzeichnisse, wobei in mittleren Fenster die jeweiligen JPEG-Bilder des aktuellen Verzeichnisses erscheinen
* Bilder lassen sich markieren – auch mehrere – dann erscheinen im rechten Fenster alle Stichwörter der jeweilig markierten Bilder
* Den markierten Bildern lässt sich im rechten Fenster nun ein Stichwort zufügen
* Klickt man auf ein Stichwort, lässt sich dieses wieder löschen


## Installieren

* Für den Betrieb sind ein Webserver und PHP erforderlich
* Ein Webserver darf sicherheitstechnisch prinzipiell nur auf die Dateien innerhalb des Dokumenten-Ordners zugreifen, deswegen müssen die zu bearbeitenden Bilder auch in diesem oder einem Unterverzeichnis liegen. 

## Konfiguration
* Im Normalfall ist keine Konfiguration notwendig, wenn die Datei *index.html* und die Skripte direkt im Dokumenten-Ordner des Webserver liegen.  
* Bei Apache findet sich die Konfiguration des Dokumenten-Ordners in der Datei *httpd.conf* als Eintrag *Document Root*, oft:
    * `DocumentRoot "C:/xampp/htdocs"`
      `<Directory "C:/xampp/htdocs">`
* *Sonderfall:* Sollen die Schnell-Taggger-Skripte und Bilder in einem Unterordner liegen, so ist der komplette Pfad in die Konstante *startverzeichnis* im Skript *script.js* einzufügen, z.B.:
    * Im JavaScirpt: `const startverzeichnis = 'C:/xampp/htdocs/schnell-taggger';`
* *Sonderfall:* Wer die Datei *index.html* anders benennt, beispielsweise als Teil einer größeren Anwendung, muss den zugehörigen Eintrag in *script.js* ändern, wegen der Funktion des Back-Buttons des Browsers. Hier fehlt noch eine automatische Erkennung.
    * `const dateiHistory = "./index_xyz.html";`

## Sicherheitskopien

Standardmäßig ist eine Funktion für Sicherheitskopien aktiv, da Bilder beim Schreiben kaputt gehen können, wenn das Skript beim Schreibvorgang gestört wird, (fremder Zugriff auf die Datei, Serverabsturz o.ä.). Die Kopien landen im Unterordner *schnell-tagger_sec*. Erst dann beginnt der Schreibvorgang.

Diese Funktion lässt sich in der Datei *script.js* deaktivieren: 
* `const sicherheitskopien = true;` //eingeschaltet (Voreinstellung)
* `const sicherheitskopien = false;` //ausgeschaltet


## Alle IPTC-Felder ändern
Das kann über die Datei *felder.ini* erfolgen, die alle Felder laut IPTC-Standard (https://de.wikipedia.org/wiki/IPTC-IIM-Standard) auflistet. 
* Wer ein Feld setzen möchte, entfernt das Semikolon am Anfang der jeweiligen Zeile und ersetzt `false` durch den gewünschten Text in Anführungszeichen (!). Ohne Text löscht das Skript das Feld, falls vorhanden.
* Ein Sonderfall ist *Coded Character Set (1#090)*. In der Voreinstellung wird hier  UTF-8 gesetzt. Achtung, dies ist eine binärer Wert! Im Skript funktioniert nur `true` für UTF-8 oder `false` für nichts. Andere Codes sind nicht vorgesehen. UTF-8 ist aber wegen der deutschen Umlaute empfehlenswert.
* Ein weiterer Sonderfall ist *Keywords (2#025)*. Dieser Inhalt kommt aus der JavaScript-Oberfläche und der Wert in der ini-Datei ist nur ein Platzhalter und das Programm ignoriert ihn.
* **Achtung!** die Einstellungen in der ini-Datei gelten für alle Bilder, die mit dem Schnell-Tagger bearbeitet werden.
* **Achtung!** Hier gemachte Einstellungen überschreiben die vorhandenen Felder.
* **Achtung!** Das Skript überprüft nicht, ob die Eingaben korrekt sind. *Coded Character Set* muss z.B. binär sein. *Country/Primary Location Code* muss ein Länderkürzel sein. Falsche Eingaben können die Bilddatei beschädigen! Bitte informieren unter dem o.g. Link informieren.


## Was fehlt noch?
* Die Konfiguration sollte über eine ini-Datei erfolgen
* Ein Test unter Linux fehlt
* Eine englische Version wäre wünschenswert
* Und eine mobile Fassung ebenso
Der Autor plant, diese Punkte abzuarbeiten
