<?php

/*Skript fügt das neue Stichwort von JavaScript und weitere Daten aus der Datei felder.ini den IPTC-Felder der Bilder hinzu
Die Stichwörter (Keywords, Feld 2#025) kommen per POST aus dem JavaScript. Die anderen Felder werden aus der Datei felder.ini gelesen.

Dann geht das Skript jede Datei durch, liest die vorhandenen IPTC-Daten aus und ergänzt sie um die neuen Daten. Prio 1 haben die Felder aus der Ini-Datei und natürlich die Keywords vom Java Script. Prio 2 haben die Felder, die schon in der Datei vorhanden sind. Felder, die weder in der INI-Datei noch in der Datei vorhanden sind, werden nicht belegt.

Ein Sonderfall ist Feld 1#090 (Character Set). Wenn in der INI-Datei "true" steht, wird das Feld mit dem Binärwert für UTF-8 belegt. Eine andere Belegung ist nicht möglich.

Bei Bedarf legt es eine Sicherheitskopie der Originaldateien im Verzeichnis .\schnell-tagger_sec an.
*/
//---------------------------------------------------------------



error_reporting(0); //Fehlermeldungen abschalten

//Übergabe POST aus dem JavaScript
$uebergabeJson = file_get_contents("php://input");
$uebergabeOhnehtml = html_entity_decode($uebergabeJson, ENT_QUOTES, "UTF-8"); //Falls sich HTML eingeschlichen hat.
$uebergabe = json_decode($uebergabeOhnehtml, true);


// $uebergabe = ["true", "Test ganz neu", "e:/web/schnell-tagger/code/testbilder/2501 Winter/DSC_2256.jpg", "e:/web/schnell-tagger/code/testbilder/2501 Winter/DSC_2261.jpg", "e:/web/schnell-tagger/code/testbilder/2501 Winter/Clipboard 1.jpg"]; //Bug

//Die Übergabe wird zerlegt
foreach ($uebergabe as $z => $element) {

    switch ($z) {
        case 0: //Sicherheitskopie Ja Nein?
            $sicherheitskopieJaNein = $element;
            break;
        case 1: //Das neue Stichwort
            $neuesStichwort = $element;
            break;
        default: //Die Liste der Bildnamen
            $bildNamen[] = $element;
            break;
    }
}

//wenn Sicherheitskopien gewünscht sind, wird ein entsprechendes Verzeichnis erstellt
if ($sicherheitskopieJaNein == "true") {

    $verzeichnisname = ".\schnell-tagger_sec";
    if (!file_exists($verzeichnisname)) mkdir($verzeichnisname);
    
    //für die Namenserweiterung der Kopien mit Datum, Uhrzeit und Zufallszahl
    $zeit = time();
    $namenserweiterung = "Schnell-Taggger-sec_" . date("Ymd_His", $zeit) . "_" . rand(1, 100000) . "_"; 
    
    
    //Jede Datei wird kopiert
    foreach ($bildNamen as $bild) {

        $quelle = $bild;
        $ziel = $verzeichnisname . "\\" . "$namenserweiterung" . basename($bild)  ;
        copy($quelle, $ziel);
    }
}


/////---------------Die Hauptfunktion: Neue Stichwörter und weitere IPTC-Felder für jede Datei zufügen


//Die Liste aller möglichen IPTC-Felder laut https://de.wikipedia.org/wiki/IPTC-IIM-Standard

//echo "Alle möglichen IPTC-Felder:<br>";
$alleFelder = array("1#020", "1#090", "2#005", "2#007", "2#010", "2#015", "2#020", "2#025", "2#040", "2#055", "2#060", "2#062", "2#063", "2#065", "2#080", "2#085", "2#090", "2#092", "2#095", "2#100", "2#101", "2#103", "2#105", "2#110", "2#115", "2#116", "2#118", "2#120", "2#122");


//Die Felder aus der INI-Datei werden ausgelesen 
$ini_array = parse_ini_file("Felder.ini", true);

//Die Felder werden nun Bild für Bild zugefügt
foreach ($bildNamen as $z2 => $bild) {

    
    //Den vorhandenen IPTC-Header auslesen
    $getSizeAuslesen = getimagesize($bild, $getIPTC); //getimagesize liefert mit dem zweiten Parameter ($getIPTC) die IPTC-Daten
    if (isset($getIPTC["APP13"])) {

        $iptcOriginal = iptcparse($getIPTC["APP13"]);
    }

    //Variable für den binären Code, der in die Bilddatei eingebettet wird. Hier noch leer
    $zumEinbetten = "";

    //Durchlauf über alle Felder
    foreach ($alleFelder as $feld) {

        $feldNeu = [];

        //Überprüfung, ob das Feld in der INI-Datei belegt ist. Das hat Prio 1. Die Stichwörter (2#025) werden hier ausgeklammert, da sie über das JavaScript kommen.
        if (isset($ini_array["IPTC-Felder"][$feld]) && $feld != "2#025") {


            //Sonderfall UTF-8: Binär
            if ($feld == "1#090" && $ini_array["IPTC-Felder"][$feld] == "true") {
                $feldNeu[] = chr(0x1b) . chr(0x25) . chr(0x47); //ESC % G;
    
            } 
            else   $feldNeu[] = $ini_array["IPTC-Felder"][$feld];
            


        } else {

            // Wenn das Feld nicht in der INI-Datei belegt ist, wird geprüft, ob das Feld bereits im Header der Datei vorkommt (Prio 2).
            if (isset($iptcOriginal[$feld])) {

                //Sonderfall UTF-8: Binär
                if ($feld == "1#090" && $ini_array["IPTC-Felder"][$feld] == "true") {
                    $feldNeu[] = chr(0x1b) . chr(0x25) . chr(0x47); //ESC % G;

                } else
                    $feldNeu = $iptcOriginal[$feld]; 

            } 

        }

        //Sonderfall Stichwort 2#025: Hier wird das neue Stichwort ergänzt, wenn es nicht schon vorhanden ist, und überschreibt nicht die vorhandenen Stichwörter
        if ($feld == "2#025") {
 
            if (in_array($neuesStichwort, $feldNeu) == false)
                $feldNeu[] = $neuesStichwort;

        }

        if ($feldNeu != []) {
        
            //Nun wird der binäre Code zum Einbetten in die Bilddatei erzeugt

            $abschnitt = (int) substr($feld, 0, 1); //Die 2 von 2#025
            $unterabschnitt = (int) substr($feld, 2, 3); //Die 025 von 2#025

            //binäre Magic
            foreach ($feldNeu as $i1) {
                $laenge = strlen($i1);
                $zumEinbetten .= chr(0x1c) . chr($abschnitt) . chr($unterabschnitt) . chr($laenge >> 8) . chr($laenge & 0xff) . $i1; //
            }
        }

    }

    

    /// Der  binäre Code wird in das Bild im IPTC-Abschnitt eingefügt. Für iptcembed gibt es drei Modi: 

    // Modus 0 - Das neue Bild mit den neuen Feldern wird in die Variable ($bildMitTagsNeu) eingefügt
    // Modus 1 - ... in die Variable eingefügt und dem Web-Client übergeben
    // Modus 2 - ... nur dem Web-Client übergeben

    $modus = 0;


    $bildMitNeuenTags = iptcembed($zumEinbetten, $bild, $modus); //Rückgabe: Ein Bild mit den neuen Tags


    //Nun schreiben wir das neue Bild in eine neue Datei gleichen Namens
    $datei = fopen($bild, "w");
    $writeist = fwrite($datei, $bildMitNeuenTags);
    fclose($datei);
}


$status[] = "ok"; //Statusmeldung

echo json_encode($status); 



//Schnell-Tagger Version 0.3; AGPL 3: https://www.gnu.org/licenses/agpl-3.0.de.html, Autor und Credit: Wolf Hosbach, http://www.wolf-hosbach.de, https://github.com/wolfhos/schnell-tagger'


