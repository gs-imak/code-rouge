"""Build the M1 validation guide PDF for Nathanael & his IT team.

Outputs: docs/m1-validation-guide.pdf

Run:
    python tools/scripts/build-validation-guide.py

Audience: non-technical client (Nathanael) + technical IT team.
Goal: turn M1 acceptance from a "sounds complicated" task into a
printable, tick-box checklist that anyone can follow.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


# Brand palette — kept restrained, prints well black-and-white too.
INK = colors.HexColor("#1a1a2e")
ACCENT = colors.HexColor("#c8102e")
MUTED = colors.HexColor("#6b7280")
RULE = colors.HexColor("#d1d5db")
PALE = colors.HexColor("#f9fafb")
GREEN = colors.HexColor("#16a34a")


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    s = {
        "Title": ParagraphStyle(
            "Title", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=22, leading=28, textColor=INK, alignment=TA_LEFT,
            spaceAfter=4,
        ),
        "Subtitle": ParagraphStyle(
            "Subtitle", parent=base["Normal"], fontName="Helvetica",
            fontSize=12, leading=16, textColor=MUTED,
            spaceAfter=20,
        ),
        "H1": ParagraphStyle(
            "H1", parent=base["Heading1"], fontName="Helvetica-Bold",
            fontSize=16, leading=22, textColor=INK,
            spaceBefore=14, spaceAfter=8,
        ),
        "H2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=12, leading=16, textColor=INK,
            spaceBefore=10, spaceAfter=4,
        ),
        "Body": ParagraphStyle(
            "Body", parent=base["Normal"], fontName="Helvetica",
            fontSize=10, leading=14, textColor=INK,
            spaceAfter=6,
        ),
        "BodySmall": ParagraphStyle(
            "BodySmall", parent=base["Normal"], fontName="Helvetica",
            fontSize=9, leading=12, textColor=MUTED,
            spaceAfter=4,
        ),
        "Code": ParagraphStyle(
            "Code", parent=base["Code"], fontName="Courier",
            fontSize=9, leading=12, textColor=INK,
            backColor=PALE, borderPadding=6,
            spaceBefore=4, spaceAfter=8,
        ),
        "Step": ParagraphStyle(
            "Step", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=10, leading=14, textColor=ACCENT,
            spaceBefore=10, spaceAfter=2,
        ),
        "Check": ParagraphStyle(
            "Check", parent=base["Normal"], fontName="Helvetica",
            fontSize=10, leading=18, textColor=INK,
            spaceAfter=2,
        ),
        "Cover": ParagraphStyle(
            "Cover", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=28, leading=34, textColor=INK, alignment=TA_LEFT,
        ),
        "CoverSub": ParagraphStyle(
            "CoverSub", parent=base["Normal"], fontName="Helvetica",
            fontSize=14, leading=18, textColor=MUTED, alignment=TA_LEFT,
            spaceAfter=24,
        ),
        "Footer": ParagraphStyle(
            "Footer", parent=base["Normal"], fontName="Helvetica",
            fontSize=8, leading=10, textColor=MUTED, alignment=TA_CENTER,
        ),
    }
    return s


def hr(width_cm: float = 17.0):
    """Thin horizontal rule, drawn as a 1-row table for layout simplicity."""
    t = Table([[""]], colWidths=[width_cm * cm], rowHeights=[1])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, RULE)]))
    return t


def cover_page(styles):
    flow = []
    flow.append(Spacer(1, 4 * cm))
    flow.append(Paragraph("Code Rouge", styles["Cover"]))
    flow.append(Paragraph(
        "Guide de validation du jalon M1<br/>Pour Nathana&euml;l Masson &amp; son &eacute;quipe IT",
        styles["CoverSub"],
    ))
    flow.append(hr())
    flow.append(Spacer(1, 1 * cm))

    meta_rows = [
        [Paragraph("<b>Projet</b>", styles["Body"]),
         Paragraph("Code Rouge &mdash; Escape game nomade pour The Game", styles["Body"])],
        [Paragraph("<b>Jalon</b>", styles["Body"]),
         Paragraph("M1 &mdash; Socle technique (v0.1.0)", styles["Body"])],
        [Paragraph("<b>Valid&eacute; en visio</b>", styles["Body"]),
         Paragraph("Jeudi 7 mai 2026", styles["Body"])],
        [Paragraph("<b>Prestataire</b>", styles["Body"]),
         Paragraph("Georges &mdash; SMK Studios", styles["Body"])],
        [Paragraph("<b>Document</b>", styles["Body"]),
         Paragraph("Guide de v&eacute;rification &amp; installation c&ocirc;t&eacute; client", styles["Body"])],
    ]
    meta = Table(meta_rows, colWidths=[5 * cm, 12 * cm])
    meta.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    flow.append(meta)

    flow.append(Spacer(1, 3 * cm))
    flow.append(hr())
    flow.append(Spacer(1, 1 * cm))

    flow.append(Paragraph(
        "<b>3 &eacute;tapes pour valider M1 :</b>",
        styles["H2"],
    ))
    steps_rows = [
        [Paragraph("<b>1. T&eacute;l&eacute;charger</b>", styles["Body"]),
         Paragraph("Le kit complet depuis la page Releases du d&eacute;p&ocirc;t GitHub.", styles["Body"])],
        [Paragraph("<b>2. Installer</b>", styles["Body"]),
         Paragraph("Les binaires sur les tablettes, le PC mallette et le NUC, en suivant la section Installation.", styles["Body"])],
        [Paragraph("<b>3. Valider</b>", styles["Body"]),
         Paragraph("Cocher les 8 cases de la checklist &mdash; ou laisser <i>validate-m1.sh</i> le faire pour vous.", styles["Body"])],
    ]
    steps = Table(steps_rows, colWidths=[3.5 * cm, 13.5 * cm])
    steps.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow.append(steps)

    return flow


def page_what_you_get(styles):
    flow = []
    flow.append(Paragraph("Ce que vous recevez", styles["H1"]))
    flow.append(Paragraph(
        "Le kit M1 est disponible sur la page Releases du d&eacute;p&ocirc;t GitHub : "
        "<font color='#1a1a2e'><b>https://github.com/gs-imak/code-rouge/releases/tag/v0.1.0</b></font>",
        styles["Body"],
    ))
    flow.append(Spacer(1, 6))

    flow.append(Paragraph("Trois binaires installables", styles["H2"]))
    bin_rows = [
        [Paragraph("<b>Fichier</b>", styles["Body"]),
         Paragraph("<b>Pour</b>", styles["Body"]),
         Paragraph("<b>Comment l'installer</b>", styles["Body"])],
        [Paragraph("<font face='Courier'>code-rouge-attaque-de-bots-v0.1.0.apk</font>", styles["BodySmall"]),
         Paragraph("Tablette Android 10\" landscape", styles["Body"]),
         Paragraph("Sideload via ADB ou cha&icirc;ne MDM", styles["Body"])],
        [Paragraph("<font face='Courier'>code-rouge-debriefing-v0.1.0.apk</font>", styles["BodySmall"]),
         Paragraph("Smartphone Android (Game Master)", styles["Body"]),
         Paragraph("Sideload identique &agrave; ci-dessus", styles["Body"])],
        [Paragraph("<font face='Courier'>code-rouge-assaut-v0.1.0-Setup.exe</font>", styles["BodySmall"]),
         Paragraph("PC Windows mallette (15\"+)", styles["Body"]),
         Paragraph("Double-clic, suivre l'installeur Windows", styles["Body"])],
    ]
    bins = Table(bin_rows, colWidths=[6.5 * cm, 5 * cm, 5.5 * cm])
    bins.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, INK),
        ("LINEBELOW", (0, 1), (-1, -2), 0.25, RULE),
    ]))
    flow.append(bins)
    flow.append(Spacer(1, 8))

    flow.append(Paragraph("Le serveur NUC", styles["H2"]))
    flow.append(Paragraph(
        "Le serveur Code Rouge tourne sur un Intel NUC sous Ubuntu 22.04 ou 24.04 LTS. "
        "Il n'est pas distribu&eacute; comme un binaire, mais comme un script d'installation idempotent :",
        styles["Body"],
    ))
    flow.append(Paragraph(
        "git clone https://github.com/gs-imak/code-rouge.git<br/>"
        "cd code-rouge<br/>"
        "sudo bash tools/scripts/install-nuc.sh",
        styles["Code"],
    ))
    flow.append(Paragraph(
        "Le script installe les d&eacute;pendances Node.js, configure le service systemd "
        "<i>code-rouge-server</i>, applique les migrations SQLite et d&eacute;marre le serveur. "
        "Il est s&ucirc;r de relancer le script &mdash; il ne casse rien si l'install est d&eacute;j&agrave; faite.",
        styles["BodySmall"],
    ))

    return flow


def page_install(styles):
    flow = []
    flow.append(Paragraph("Installation", styles["H1"]))
    flow.append(Paragraph(
        "Trois sections, ind&eacute;pendantes. Si vous installez les machines dans cet ordre "
        "(NUC d'abord, puis tablettes, puis PC), la validation est plus simple : les apps "
        "trouvent le serveur d&egrave;s leur premier d&eacute;marrage.",
        styles["Body"],
    ))

    # NUC
    flow.append(Paragraph("1 &mdash; NUC (serveur central)", styles["H2"]))
    flow.append(Paragraph(
        "Pr&eacute;-requis : Ubuntu 22.04 ou 24.04 LTS, acc&egrave;s SSH, droits sudo.",
        styles["BodySmall"],
    ))
    flow.append(Paragraph("Connexion + clone du d&eacute;p&ocirc;t :", styles["Step"]))
    flow.append(Paragraph(
        "ssh nathanael@nuc.local<br/>"
        "git clone https://github.com/gs-imak/code-rouge.git<br/>"
        "cd code-rouge",
        styles["Code"],
    ))
    flow.append(Paragraph("Installation :", styles["Step"]))
    flow.append(Paragraph(
        "sudo bash tools/scripts/install-nuc.sh",
        styles["Code"],
    ))
    flow.append(Paragraph(
        "Dur&eacute;e attendue : 3 &agrave; 5 minutes selon le d&eacute;bit r&eacute;seau.",
        styles["BodySmall"],
    ))
    flow.append(Paragraph("V&eacute;rification :", styles["Step"]))
    flow.append(Paragraph(
        "bash tools/scripts/validate-m1.sh",
        styles["Code"],
    ))
    flow.append(Paragraph(
        "Le script affiche 8 contr&ocirc;les avec une coche verte ou une croix rouge. "
        "Si tout est vert, le NUC est pr&ecirc;t. Si une croix appara&icirc;t, la ligne "
        "indique exactement quoi corriger.",
        styles["Body"],
    ))

    # Tablets
    flow.append(Paragraph("2 &mdash; Tablettes Android", styles["H2"]))
    flow.append(Paragraph(
        "Pr&eacute;-requis : Android 10+ (API 29+), c&acirc;ble USB, mode d&eacute;veloppeur activ&eacute; (8&times;tap sur la version d'Android dans Param&egrave;tres &rarr; &Agrave; propos).",
        styles["BodySmall"],
    ))
    flow.append(Paragraph("Activer Screen Pinning :", styles["Step"]))
    flow.append(Paragraph(
        "Param&egrave;tres &rarr; S&eacute;curit&eacute; et confidentialit&eacute; "
        "&rarr; Plus de param&egrave;tres &rarr; <b>&Eacute;pinglage d'&eacute;cran</b> &rarr; activer.",
        styles["Body"],
    ))
    flow.append(Paragraph("Sideload de l'APK :", styles["Step"]))
    flow.append(Paragraph(
        "adb install code-rouge-attaque-de-bots-v0.1.0.apk<br/>"
        "# r&eacute;p&eacute;ter sur le smartphone GM avec :<br/>"
        "adb install code-rouge-debriefing-v0.1.0.apk",
        styles["Code"],
    ))
    flow.append(Paragraph(
        "Note : si le serveur de votre entreprise distribue les apps via un MDM "
        "(Mobile Device Management), c'est le m&ecirc;me .apk &mdash; signature debug, "
        "ne n&eacute;cessite pas de magasin d'applications.",
        styles["BodySmall"],
    ))

    # PC
    flow.append(Paragraph("3 &mdash; PC mallette Windows", styles["H2"]))
    flow.append(Paragraph(
        "Pr&eacute;-requis : Windows 10 (b&acirc;timent 1909+) ou Windows 11, 8&nbsp;Go RAM minimum, &eacute;cran 15\" minimum.",
        styles["BodySmall"],
    ))
    flow.append(Paragraph("Installation :", styles["Step"]))
    flow.append(Paragraph(
        "Double-clic sur <i>code-rouge-assaut-v0.1.0-Setup.exe</i>.<br/>"
        "Suivre l'installeur (NSIS standard). Choisir l'emplacement par d&eacute;faut.<br/>"
        "L'application est ensuite accessible depuis le menu D&eacute;marrer sous &laquo;&nbsp;Code Rouge &mdash; Assaut&nbsp;&raquo;.",
        styles["Body"],
    ))
    flow.append(Paragraph("Premier lancement :", styles["Step"]))
    flow.append(Paragraph(
        "Au premier d&eacute;marrage, l'app passe en plein &eacute;cran sans bord et bloque "
        "Alt+Tab, Alt+F4, Win+L, Ctrl+Esc, Ctrl+Shift+Esc. C'est le mode kiosque "
        "contractuel. Pour quitter en cas de besoin pendant l'install : "
        "<b>Ctrl+Alt+Suppr</b> &rarr; D&eacute;connexion (la touche est syst&egrave;me, "
        "elle ne peut pas &ecirc;tre intercept&eacute;e).",
        styles["Body"],
    ))

    return flow


def page_checklist(styles):
    flow = []
    flow.append(Paragraph("Checklist de validation", styles["H1"]))
    flow.append(Paragraph(
        "Cocher chaque case apr&egrave;s avoir v&eacute;rifi&eacute; le comportement. "
        "<b>Si toutes les cases sont coch&eacute;es, M1 est valid&eacute;.</b> "
        "Si une case ne peut pas &ecirc;tre coch&eacute;e, indiquez ce qui s'est pass&eacute; "
        "dans la marge et envoyez le document &agrave; Georges.",
        styles["Body"],
    ))
    flow.append(Spacer(1, 6))

    checks = [
        ("Serveur NUC", "Le script <i>validate-m1.sh</i> renvoie &laquo;&nbsp;TOUT EST VERT&nbsp;&raquo;."),
        ("R&eacute;seau", "L'URL <font face='Courier'>http://&lt;ip-du-nuc&gt;:8080/diag</font> retourne un JSON depuis n'importe quelle machine du r&eacute;seau Wi-Fi local."),
        ("Assaut Windows &mdash; mode kiosque", "L'app s'ouvre en plein &eacute;cran sans bord. Alt+Tab, Alt+F4, Win+L sont bloqu&eacute;s (testez chacun, l'app reste au premier plan)."),
        ("Attaque de Bots &mdash; mode kiosque", "Sur la tablette, Screen Pinning est activ&eacute;. Le bouton Retour et le bouton Accueil ne sortent pas de l'app."),
        ("D&eacute;briefing &mdash; mode kiosque", "Idem sur le smartphone du Game Master."),
        ("Persistance", "Forcer un reboot du PC ou de la tablette pendant qu'une app est ouverte. Au red&eacute;marrage, l'app revient au m&ecirc;me &eacute;cran &mdash; pas &agrave; l'&eacute;cran d'accueil."),
        ("Indicateur r&eacute;seau", "Sur les 3 apps, un point vert (ou rouge) appara&icirc;t indiquant la connectivit&eacute; au NUC. D&eacute;brancher le NUC : le point passe rouge en moins de 2 secondes."),
        ("CI verte", "Sur GitHub, le dernier commit de <i>main</i> affiche une coche verte (<font face='Courier'>https://github.com/gs-imak/code-rouge/actions</font>)."),
    ]

    rows = [[Paragraph("<b>&#9744;</b>", styles["Check"]),
             Paragraph(f"<b>{title}</b><br/>{desc}", styles["Body"])]
            for title, desc in checks]
    t = Table(rows, colWidths=[1.2 * cm, 15.8 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, RULE),
    ]))
    flow.append(t)

    flow.append(Spacer(1, 12))
    flow.append(Paragraph(
        "<b>R&eacute;sultat global :</b>&nbsp;&nbsp;"
        "&#9744;&nbsp;Tout est vert, M1 est valid&eacute;.&nbsp;&nbsp;&nbsp;"
        "&#9744;&nbsp;Une case manque, voir notes ci-dessous.",
        styles["Body"],
    ))
    flow.append(Spacer(1, 4))
    flow.append(Paragraph(
        "Notes / probl&egrave;mes rencontr&eacute;s :",
        styles["BodySmall"],
    ))
    notes_box = Table([[" "]] * 4, colWidths=[17 * cm], rowHeights=[10 * mm] * 4)
    notes_box.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, RULE),
    ]))
    flow.append(notes_box)

    return flow


def page_troubleshooting(styles):
    flow = []
    flow.append(Paragraph("En cas de probl&egrave;me", styles["H1"]))
    flow.append(Paragraph(
        "Top 5 des soucis les plus probables et leur correctif imm&eacute;diat. "
        "Si rien ne correspond, le rapport <i>validate-m1.sh</i> sauvegard&eacute; "
        "dans <font face='Courier'>/tmp/m1-validation-*.txt</font> donne souvent la r&eacute;ponse.",
        styles["Body"],
    ))
    flow.append(Spacer(1, 6))

    issues = [
        (
            "Le port 8080 n'est pas en &eacute;coute",
            "Le service <i>code-rouge-server</i> ne tourne pas, ou un autre processus occupe le port.",
            "<font face='Courier'>sudo systemctl status code-rouge-server</font><br/>"
            "&mdash;&nbsp;Si <i>inactive</i> : <font face='Courier'>sudo systemctl start code-rouge-server</font><br/>"
            "&mdash;&nbsp;Si <i>failed</i> : <font face='Courier'>sudo journalctl -u code-rouge-server -n 50</font>",
        ),
        (
            "L'APK refuse de s'installer (&laquo;&nbsp;app non v&eacute;rifi&eacute;e&nbsp;&raquo;)",
            "L'APK est sign&eacute; en mode debug. Android Play Protect peut bloquer l'install.",
            "Param&egrave;tres &rarr; S&eacute;curit&eacute; &rarr; Play Protect &rarr; D&eacute;sactiver "
            "le scan d'apps install&eacute;es par sideload, ou installer via ADB qui contourne ce filtre.",
        ),
        (
            "L'app Assaut ne d&eacute;marre pas en plein &eacute;cran",
            "Probable conflit avec un autre logiciel kiosque ou un GPU pilote.",
            "Mettre &agrave; jour les pilotes GPU. Si l'app est install&eacute;e mais ne se lance pas, "
            "v&eacute;rifier dans le Gestionnaire de t&acirc;ches qu'elle ne tourne pas d&eacute;j&agrave; "
            "(le verrouillage anti-double-instance peut bloquer un second lancement).",
        ),
        (
            "Le point r&eacute;seau reste rouge",
            "Les apps ne trouvent pas le NUC. R&eacute;seau Wi-Fi ou IP mal configur&eacute;.",
            "1) V&eacute;rifier que la tablette / PC est sur le m&ecirc;me r&eacute;seau Wi-Fi que le NUC.<br/>"
            "2) Tester depuis un t&eacute;l&eacute;phone : ouvrir <font face='Courier'>http://&lt;ip-nuc&gt;:8080/diag</font>.<br/>"
            "3) Configurer l'IP du NUC dans &laquo;&nbsp;Setup admin&nbsp;&raquo; sur D&eacute;briefing.",
        ),
        (
            "Une app a plant&eacute; pendant un test",
            "Anomalie ponctuelle, ou bug r&eacute;el &agrave; investiguer.",
            "1) Forcer-fermer l'app, la relancer : si l'app revient &agrave; l'&eacute;cran o&ugrave; elle &eacute;tait, "
            "la persistance fait son travail (&ccedil;a confirme la case &laquo;&nbsp;Persistance&nbsp;&raquo;).<br/>"
            "2) Si le crash est reproductible, envoyer un message &agrave; Georges avec la s&eacute;quence d'actions.",
        ),
    ]

    issue_rows = []
    issue_rows.append([
        Paragraph("<b>Probl&egrave;me</b>", styles["Body"]),
        Paragraph("<b>Cause probable</b>", styles["Body"]),
        Paragraph("<b>Que faire</b>", styles["Body"]),
    ])
    for problem, cause, fix in issues:
        issue_rows.append([
            Paragraph(problem, styles["Body"]),
            Paragraph(cause, styles["BodySmall"]),
            Paragraph(fix, styles["BodySmall"]),
        ])
    issues_table = Table(issue_rows, colWidths=[5 * cm, 4.5 * cm, 7.5 * cm])
    issues_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, INK),
        ("LINEBELOW", (0, 1), (-1, -2), 0.25, RULE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    flow.append(issues_table)

    flow.append(Spacer(1, 16))
    flow.append(Paragraph("Contact", styles["H2"]))
    contact_rows = [
        [Paragraph("<b>Prestataire technique</b>", styles["Body"]),
         Paragraph("Georges &mdash; SMK Studios", styles["Body"])],
        [Paragraph("<b>Issues GitHub</b>", styles["Body"]),
         Paragraph("https://github.com/gs-imak/code-rouge/issues", styles["Body"])],
        [Paragraph("<b>Contact direct</b>", styles["Body"]),
         Paragraph("Coordonn&eacute;es transmises s&eacute;par&eacute;ment.", styles["Body"])],
    ]
    ct = Table(contact_rows, colWidths=[5 * cm, 12 * cm])
    ct.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    flow.append(ct)

    return flow


def page_signoff(styles):
    flow = []
    flow.append(Paragraph("Validation finale", styles["H1"]))
    flow.append(Paragraph(
        "&Agrave; remplir une fois les 8 cases coch&eacute;es. Cette signature acte la r&eacute;ception "
        "fonctionnelle du jalon M1 c&ocirc;t&eacute; client. La validation contractuelle elle-m&ecirc;me "
        "a d&eacute;j&agrave; eu lieu en visio le 7 mai 2026 ; ce document compl&egrave;te la trace c&ocirc;t&eacute; "
        "exploitant.",
        styles["Body"],
    ))
    flow.append(Spacer(1, 12))

    flow.append(Paragraph("Conditions de r&eacute;ception", styles["H2"]))
    cond = [
        "Les 8 cases de la checklist sont coch&eacute;es, ou les exceptions sont d&eacute;crites en notes.",
        "Le rapport <i>validate-m1.sh</i> a &eacute;t&eacute; ex&eacute;cut&eacute; et sauvegard&eacute; (joindre une copie).",
        "Les binaires install&eacute;s correspondent &agrave; la release v0.1.0 publi&eacute;e sur GitHub.",
        "Aucune anomalie bloquante n'a &eacute;t&eacute; observ&eacute;e pendant la s&eacute;quence de tests.",
    ]
    for c in cond:
        flow.append(Paragraph(f"&#9744;&nbsp;&nbsp;{c}", styles["Check"]))
    flow.append(Spacer(1, 16))

    flow.append(Paragraph("Signature", styles["H2"]))
    sig_rows = [
        [Paragraph("<b>Pour The Game</b>", styles["Body"]),
         Paragraph("<b>Pour SMK Studios</b>", styles["Body"])],
        [Paragraph(
            "Nathana&euml;l Masson<br/>Fondateur, The Game<br/><br/>"
            "Date&nbsp;: ____________________<br/><br/>"
            "Signature&nbsp;:<br/><br/><br/>",
            styles["BodySmall"],
        ),
         Paragraph(
            "Georges<br/>SMK Studios<br/><br/>"
            "Date&nbsp;: ____________________<br/><br/>"
            "Signature&nbsp;:<br/><br/><br/>",
            styles["BodySmall"],
        )],
    ]
    sig = Table(sig_rows, colWidths=[8.5 * cm, 8.5 * cm])
    sig.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 1), (-1, 1), 0.5, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 30),
    ]))
    flow.append(sig)

    return flow


def draw_page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(
        A4[0] / 2,
        12 * mm,
        f"Code Rouge — Guide de validation M1 — page {doc.page} — généré le 2026-05-07",
    )
    canvas.restoreState()


def build(out_path: Path) -> None:
    styles = make_styles()

    doc = BaseDocTemplate(
        str(out_path),
        pagesize=A4,
        title="Code Rouge — Guide de validation M1",
        author="Georges (SMK Studios) pour The Game",
        subject="Guide de vérification et installation côté client",
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2.5 * cm,
    )
    frame = Frame(
        doc.leftMargin, doc.bottomMargin, doc.width, doc.height,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        id="main",
    )
    template = PageTemplate(id="main", frames=[frame], onPage=draw_page_footer)
    doc.addPageTemplates([template])

    story = []
    story.extend(cover_page(styles))
    story.append(PageBreak())
    story.extend(page_what_you_get(styles))
    story.append(PageBreak())
    story.extend(page_install(styles))
    story.append(PageBreak())
    story.extend(page_checklist(styles))
    story.append(PageBreak())
    story.extend(page_troubleshooting(styles))
    story.append(PageBreak())
    story.extend(page_signoff(styles))

    doc.build(story)


if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parent.parent.parent
    out = repo_root / "docs" / "m1-validation-guide.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    build(out)
    print(f"OK -> {out}")
