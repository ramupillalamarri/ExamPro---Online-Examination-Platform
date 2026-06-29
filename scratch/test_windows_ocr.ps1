# Load Windows Runtime assemblies
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime]
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]

# Helper to await WinRT async operations in PowerShell
function Await-WinRT($AsyncOperation) {
    # Convert WinRT IAsyncOperation to .NET Task
    $task = [System.WindowsRuntimeSystemExtensions]::AsTask($AsyncOperation)
    # Wait for the task to complete
    $task.Wait()
    return $task.Result
}

$imagePath = (Resolve-Path "scratch/page2.png").Path
Write-Output "Loading image from: $imagePath"

$fileOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($imagePath)
$file = Await-WinRT($fileOp)

$streamOp = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
$stream = Await-WinRT($streamOp)

$decoderOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
$decoder = Await-WinRT($decoderOp)

$bitmapOp = $decoder.GetSoftwareBitmapAsync()
$softwareBitmap = Await-WinRT($bitmapOp)

Write-Output "Initializing Windows OCR Engine..."
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) {
    Write-Error "Could not create Windows OCR engine."
    exit 1
}

Write-Output "Running OCR..."
$ocrOp = $engine.RecognizeAsync($softwareBitmap)
$result = Await-WinRT($ocrOp)

Write-Output "=== OCR Result ==="
Write-Output $result.Text
