<?php
//Schnell-Tagger Version 0.3.1; AGPL 3: https://www.gnu.org/licenses/agpl-3.0.de.html, Autor und Credit: Wolf Hosbach, http://www.wolf-hosbach.de, https://github.com/wolfhos/schnell-tagger'

///Skript liest die Metadaten für Keyword 2#025 aus einem Bild und gibt diese als JSON an fetch zurück

error_reporting(0);

$bildnamenGet = file_get_contents("php://input");
$bildnamen = json_decode($bildnamenGet, true);



/////////////Auslesen des IPTC-Daten

$fertigeListe = array();

foreach ($bildnamen as $einBild) {


    $bildKomplett = array();
    $bildKomplett[] = $einBild; //bildKomplett besteht aus dem Bildnamen und einem Array mit den Stichwörtern. Das Bild kommt hier schon mal rein
    $stichwoerter = array();

    //getimagesize liest die Metadaten aus
    $size = getimagesize($einBild, $infos);
    if (isset($infos["APP13"])) {

        $iptc_orig = iptcparse($infos["APP13"]);

        foreach ($iptc_orig as $i => $einiptc) {

            if ($i == "2#025") {

                foreach ($einiptc as $j => $einiptc2)
                    $stichwoerter[] = $einiptc2;
            }

        }
        $bildKomplett[] = $stichwoerter; //Jetzt kommen die Stichwörter aus dem IPTC-Header hinzu

    }
    //wenn es keine IPTC-Stichwörter gibt:
    else $bildKomplett[] = [];
    

    $fertigeListe[] = $bildKomplett; //Das Bild mit den Stichwörtern kommt in die fertige Liste



}

//bug var_dump($fertigeListe);

//übergabe der fertigen Liste als JSON
$jshoh = json_encode($fertigeListe);

echo $jshoh;
