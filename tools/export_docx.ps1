param(
    [Parameter(Mandatory = $true)][string]$DocxPath,
    [Parameter(Mandatory = $true)][string]$PdfPath
)

$ErrorActionPreference = 'Stop'
$word = $null
$doc = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open($DocxPath)
    $doc.Fields.Update() | Out-Null
    if ($doc.TablesOfContents.Count -gt 0) {
        $doc.TablesOfContents.Item(1).Update()
    }
    foreach ($styleName in @('TOC 1', 'TOC 2')) {
        try {
            $style = $doc.Styles.Item($styleName)
            $style.ParagraphFormat.SpaceBefore = 0
            $style.ParagraphFormat.SpaceAfter = 0
            $style.ParagraphFormat.LineSpacingRule = 0
            $style.Font.Size = 10
        }
        catch {
            Write-Output "TOC_STYLE_SKIPPED:$styleName"
        }
    }
    $doc.Save()
    $doc.ExportAsFixedFormat($PdfPath, 17)
    Write-Output 'PDF_EXPORTED'
}
finally {
    if ($null -ne $doc) {
        $doc.Close($false)
    }
    if ($null -ne $word) {
        $word.Quit()
    }
    if ($null -ne $doc) {
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
    }
    if ($null -ne $word) {
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
