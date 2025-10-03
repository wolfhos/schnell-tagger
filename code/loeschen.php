<?php

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
            $stichwortZumLoeschen = $element;
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




$status[] = "ok"; //Statusmeldung

echo json_encode($status); 



//Schnell-Tagger Version 0.2; AGPL 3: https://www.gnu.org/licenses/agpl-3.0.de.html, Autor und Credit: Wolf Hosbach, http://www.wolf-hosbach.de, https://github.com/wolfhos/schnell-tagger'
