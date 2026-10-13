/**
 * Admin page translations.
 *
 * Only the Block Kit admin page is translated: EmDash renders manifest labels
 * (sidebar page name, generated settings form) as static strings.
 */

export interface BulkCounts {
	scanned: number;
	converted: number;
	skipped: number;
	failed: number;
	existing: number;
}

export interface Messages {
	title: string;
	statFormat: string;
	statAutoConvert: string;
	statConverted: (format: string) => string;
	statSkippedFailed: string;
	on: string;
	off: string;

	bulkHeader: string;
	bulkStatus: { running: string; done: string; cancelled: string; idle: string };
	bulkBannerTitle: (format: string, status: string) => string;
	bulkBannerCounts: (c: BulkCounts) => string;
	bulkCronHint: string;
	bulkRunNext: string;
	bulkRefresh: string;
	bulkStop: string;
	bulkStopConfirmTitle: string;
	bulkStopConfirmText: string;
	bulkStopConfirmOk: string;
	bulkStopConfirmDeny: string;
	bulkIntro: (format: string) => string;
	bulkStart: (format: string) => string;
	bulkStartConfirmTitle: string;
	bulkStartConfirmText: (batchSize: number) => string;
	bulkStartConfirmOk: string;
	cancel: string;

	settingsHeader: string;
	formatLabel: string;
	formatWebp: string;
	formatAvif: string;
	autoConvertLabel: string;
	autoConvertDescription: string;
	qualityLabel: string;
	saveSettings: string;
	settingsNote: string;
	advancedSettings: string;

	historyHeader: string;
	historyEmpty: string;
	colSource: string;
	colConverted: string;
	colStatus: string;
	colDetail: string;
	colDate: string;
	status: { processing: string; converted: string; skipped: string; failed: string };
	reasonLarger: string;
	reasonTooLarge: string;

	toastSettingsSaved: string;
	toastBulkStarted: string;
	toastBulkDone: string;
	toastBatchProcessed: string;
	toastBusy: string;
	toastBulkStopped: string;
}

const en: Messages = {
	title: "Image Optimizer (WebP / AVIF)",
	statFormat: "Output format",
	statAutoConvert: "Convert on upload",
	statConverted: (f) => `Converted to ${f}`,
	statSkippedFailed: "Skipped / failed",
	on: "On",
	off: "Off",

	bulkHeader: "Bulk-convert existing images",
	bulkStatus: { running: "running", done: "complete", cancelled: "stopped", idle: "idle" },
	bulkBannerTitle: (f, s) => `Bulk conversion (${f}): ${s}`,
	bulkBannerCounts: (c) =>
		`Checked ${c.scanned} · converted ${c.converted} · skipped ${c.skipped} · ` +
		`failed ${c.failed} · already converted ${c.existing}`,
	bulkCronHint:
		"If plugin cron is running on your server, the job advances every minute in the background. You can also advance it with “Run next batch”.",
	bulkRunNext: "Run next batch",
	bulkRefresh: "Refresh progress",
	bulkStop: "Stop",
	bulkStopConfirmTitle: "Stop bulk conversion?",
	bulkStopConfirmText: "Images already converted are kept.",
	bulkStopConfirmOk: "Stop",
	bulkStopConfirmDeny: "Keep going",
	bulkIntro: (f) =>
		`Converts every JPEG / PNG in the media library to ${f} and saves each result as a new media item. Images already converted are skipped and failed ones are retried.`,
	bulkStart: (f) => `Start converting to ${f}`,
	bulkStartConfirmTitle: "Start bulk conversion?",
	bulkStartConfirmText: (n) =>
		`Images are processed ${n} at a time. Originals are kept and converted copies are added.`,
	bulkStartConfirmOk: "Start",
	cancel: "Cancel",

	settingsHeader: "Settings",
	formatLabel: "Output format",
	formatWebp: "WebP — displays in virtually every browser",
	formatAvif: "AVIF — smaller files, but slower to convert",
	autoConvertLabel: "Convert on upload",
	autoConvertDescription:
		"When a JPEG / PNG is uploaded, a converted copy is saved as a new media item.",
	qualityLabel: "Quality (1–100)",
	saveSettings: "Save settings",
	settingsNote:
		"Original images are never modified or deleted. Batch size and encoder can be changed in the plugin settings.",
	advancedSettings: "Advanced settings",

	historyHeader: "Conversion history",
	historyEmpty: "No images have been converted yet.",
	colSource: "Original",
	colConverted: "Converted",
	colStatus: "Status",
	colDetail: "Details",
	colDate: "Updated",
	status: { processing: "Processing", converted: "Converted", skipped: "Skipped", failed: "Failed" },
	reasonLarger: "Output was larger than the original",
	reasonTooLarge: "Larger than 16 MB",

	toastSettingsSaved: "Settings saved",
	toastBulkStarted: "Bulk conversion started",
	toastBulkDone: "Bulk conversion complete",
	toastBatchProcessed: "Batch processed",
	toastBusy: "Another batch is running. Refresh in a moment.",
	toastBulkStopped: "Bulk conversion stopped",
};

const ja: Messages = {
	title: "画像変換（WebP / AVIF）",
	statFormat: "出力形式",
	statAutoConvert: "アップロード時の変換",
	statConverted: (f) => `${f} 変換済み`,
	statSkippedFailed: "スキップ / 失敗",
	on: "オン",
	off: "オフ",

	bulkHeader: "アップロード済み画像の一括変換",
	bulkStatus: { running: "実行中", done: "完了", cancelled: "停止済み", idle: "待機中" },
	bulkBannerTitle: (f, s) => `一括変換（${f}）: ${s}`,
	bulkBannerCounts: (c) =>
		`確認 ${c.scanned} 件 / 変換 ${c.converted} 件 / スキップ ${c.skipped} 件 / ` +
		`失敗 ${c.failed} 件 / 変換済みのため省略 ${c.existing} 件`,
	bulkCronHint:
		"サーバーでプラグインの cron が動いている場合は、バックグラウンドで1分ごとに進みます。「次のバッチを実行」で手動でも進められます。",
	bulkRunNext: "次のバッチを実行",
	bulkRefresh: "進捗を更新",
	bulkStop: "停止",
	bulkStopConfirmTitle: "一括変換を停止しますか？",
	bulkStopConfirmText: "変換済みの画像はそのまま残ります。",
	bulkStopConfirmOk: "停止",
	bulkStopConfirmDeny: "続ける",
	bulkIntro: (f) =>
		`メディアライブラリ内の JPEG / PNG を ${f} に変換して新しいメディアとして保存します。変換済みの画像は省略し、失敗した画像は再試行します。`,
	bulkStart: (f) => `${f} への一括変換を開始`,
	bulkStartConfirmTitle: "一括変換を開始しますか？",
	bulkStartConfirmText: (n) =>
		`${n} 件ずつ処理します。元の画像は残り、変換後の画像が追加されます。`,
	bulkStartConfirmOk: "開始",
	cancel: "キャンセル",

	settingsHeader: "設定",
	formatLabel: "変換形式",
	formatWebp: "WebP — ほぼすべてのブラウザで表示できます",
	formatAvif: "AVIF — より小さくなりますが、変換に時間がかかります",
	autoConvertLabel: "アップロード時に自動変換",
	autoConvertDescription:
		"JPEG / PNG をアップロードすると、変換したコピーを新しいメディアとして保存します。",
	qualityLabel: "品質（1〜100）",
	saveSettings: "設定を保存",
	settingsNote:
		"元の画像は変更・削除されません。バッチサイズやエンコーダーはプラグインの設定画面で変更できます。",
	advancedSettings: "詳細設定",

	historyHeader: "変換履歴",
	historyEmpty: "まだ変換した画像はありません。",
	colSource: "元の画像",
	colConverted: "変換後",
	colStatus: "状態",
	colDetail: "詳細",
	colDate: "日時",
	status: { processing: "処理中", converted: "変換済み", skipped: "スキップ", failed: "失敗" },
	reasonLarger: "変換後の方が大きい",
	reasonTooLarge: "16MB超",

	toastSettingsSaved: "設定を保存しました",
	toastBulkStarted: "一括変換を開始しました",
	toastBulkDone: "一括変換が完了しました",
	toastBatchProcessed: "バッチを処理しました",
	toastBusy: "別のバッチを処理中です。しばらくしてから更新してください",
	toastBulkStopped: "一括変換を停止しました",
};

const zhCN: Messages = {
	title: "图片优化（WebP / AVIF）",
	statFormat: "输出格式",
	statAutoConvert: "上传时转换",
	statConverted: (f) => `已转换为 ${f}`,
	statSkippedFailed: "跳过 / 失败",
	on: "开",
	off: "关",

	bulkHeader: "批量转换已上传的图片",
	bulkStatus: { running: "进行中", done: "已完成", cancelled: "已停止", idle: "空闲" },
	bulkBannerTitle: (f, s) => `批量转换（${f}）：${s}`,
	bulkBannerCounts: (c) =>
		`已检查 ${c.scanned} · 已转换 ${c.converted} · 已跳过 ${c.skipped} · ` +
		`失败 ${c.failed} · 之前已转换 ${c.existing}`,
	bulkCronHint:
		"如果服务器上运行着插件 cron，任务会在后台每分钟推进一次。也可以点击“运行下一批”手动推进。",
	bulkRunNext: "运行下一批",
	bulkRefresh: "刷新进度",
	bulkStop: "停止",
	bulkStopConfirmTitle: "要停止批量转换吗？",
	bulkStopConfirmText: "已转换的图片会保留。",
	bulkStopConfirmOk: "停止",
	bulkStopConfirmDeny: "继续",
	bulkIntro: (f) =>
		`将媒体库中的所有 JPEG / PNG 转换为 ${f}，并将结果另存为新的媒体。已转换的图片会被跳过，失败的图片会重试。`,
	bulkStart: (f) => `开始转换为 ${f}`,
	bulkStartConfirmTitle: "要开始批量转换吗？",
	bulkStartConfirmText: (n) => `每次处理 ${n} 个。原图会保留，并添加转换后的副本。`,
	bulkStartConfirmOk: "开始",
	cancel: "取消",

	settingsHeader: "设置",
	formatLabel: "输出格式",
	formatWebp: "WebP — 几乎所有浏览器都能显示",
	formatAvif: "AVIF — 文件更小，但转换较慢",
	autoConvertLabel: "上传时自动转换",
	autoConvertDescription: "上传 JPEG / PNG 时，会将转换后的副本保存为新的媒体。",
	qualityLabel: "质量（1–100）",
	saveSettings: "保存设置",
	settingsNote: "原图不会被修改或删除。批次大小和编码器可在插件设置中更改。",
	advancedSettings: "高级设置",

	historyHeader: "转换记录",
	historyEmpty: "尚未转换任何图片。",
	colSource: "原图",
	colConverted: "转换后",
	colStatus: "状态",
	colDetail: "详情",
	colDate: "更新时间",
	status: { processing: "处理中", converted: "已转换", skipped: "已跳过", failed: "失败" },
	reasonLarger: "转换后比原图更大",
	reasonTooLarge: "超过 16 MB",

	toastSettingsSaved: "设置已保存",
	toastBulkStarted: "批量转换已开始",
	toastBulkDone: "批量转换已完成",
	toastBatchProcessed: "已处理一批",
	toastBusy: "另一批正在处理中，请稍后刷新。",
	toastBulkStopped: "批量转换已停止",
};

const zhTW: Messages = {
	title: "圖片最佳化（WebP / AVIF）",
	statFormat: "輸出格式",
	statAutoConvert: "上傳時轉換",
	statConverted: (f) => `已轉換為 ${f}`,
	statSkippedFailed: "略過 / 失敗",
	on: "開",
	off: "關",

	bulkHeader: "批次轉換已上傳的圖片",
	bulkStatus: { running: "進行中", done: "已完成", cancelled: "已停止", idle: "閒置" },
	bulkBannerTitle: (f, s) => `批次轉換（${f}）：${s}`,
	bulkBannerCounts: (c) =>
		`已檢查 ${c.scanned} · 已轉換 ${c.converted} · 已略過 ${c.skipped} · ` +
		`失敗 ${c.failed} · 先前已轉換 ${c.existing}`,
	bulkCronHint:
		"如果伺服器上執行著外掛 cron，工作會在背景每分鐘推進一次。也可以按「執行下一批」手動推進。",
	bulkRunNext: "執行下一批",
	bulkRefresh: "重新整理進度",
	bulkStop: "停止",
	bulkStopConfirmTitle: "要停止批次轉換嗎？",
	bulkStopConfirmText: "已轉換的圖片會保留。",
	bulkStopConfirmOk: "停止",
	bulkStopConfirmDeny: "繼續",
	bulkIntro: (f) =>
		`將媒體庫中的所有 JPEG / PNG 轉換為 ${f}，並將結果另存為新的媒體。已轉換的圖片會略過，失敗的圖片會重試。`,
	bulkStart: (f) => `開始轉換為 ${f}`,
	bulkStartConfirmTitle: "要開始批次轉換嗎？",
	bulkStartConfirmText: (n) => `每次處理 ${n} 個。原圖會保留，並新增轉換後的副本。`,
	bulkStartConfirmOk: "開始",
	cancel: "取消",

	settingsHeader: "設定",
	formatLabel: "輸出格式",
	formatWebp: "WebP — 幾乎所有瀏覽器都能顯示",
	formatAvif: "AVIF — 檔案更小，但轉換較慢",
	autoConvertLabel: "上傳時自動轉換",
	autoConvertDescription: "上傳 JPEG / PNG 時，會將轉換後的副本儲存為新的媒體。",
	qualityLabel: "品質（1–100）",
	saveSettings: "儲存設定",
	settingsNote: "原圖不會被修改或刪除。批次大小與編碼器可在外掛設定中變更。",
	advancedSettings: "進階設定",

	historyHeader: "轉換紀錄",
	historyEmpty: "尚未轉換任何圖片。",
	colSource: "原圖",
	colConverted: "轉換後",
	colStatus: "狀態",
	colDetail: "詳細資訊",
	colDate: "更新時間",
	status: { processing: "處理中", converted: "已轉換", skipped: "已略過", failed: "失敗" },
	reasonLarger: "轉換後比原圖更大",
	reasonTooLarge: "超過 16 MB",

	toastSettingsSaved: "設定已儲存",
	toastBulkStarted: "批次轉換已開始",
	toastBulkDone: "批次轉換已完成",
	toastBatchProcessed: "已處理一批",
	toastBusy: "另一批正在處理中，請稍後重新整理。",
	toastBulkStopped: "批次轉換已停止",
};

const ko: Messages = {
	title: "이미지 최적화 (WebP / AVIF)",
	statFormat: "출력 형식",
	statAutoConvert: "업로드 시 변환",
	statConverted: (f) => `${f} 변환 완료`,
	statSkippedFailed: "건너뜀 / 실패",
	on: "켜짐",
	off: "꺼짐",

	bulkHeader: "업로드된 이미지 일괄 변환",
	bulkStatus: { running: "실행 중", done: "완료", cancelled: "중지됨", idle: "대기 중" },
	bulkBannerTitle: (f, s) => `일괄 변환 (${f}): ${s}`,
	bulkBannerCounts: (c) =>
		`확인 ${c.scanned}개 · 변환 ${c.converted}개 · 건너뜀 ${c.skipped}개 · ` +
		`실패 ${c.failed}개 · 이미 변환됨 ${c.existing}개`,
	bulkCronHint:
		"서버에서 플러그인 cron이 실행 중이면 백그라운드에서 1분마다 진행됩니다. ‘다음 배치 실행’으로 직접 진행할 수도 있습니다.",
	bulkRunNext: "다음 배치 실행",
	bulkRefresh: "진행 상황 새로고침",
	bulkStop: "중지",
	bulkStopConfirmTitle: "일괄 변환을 중지할까요?",
	bulkStopConfirmText: "이미 변환된 이미지는 그대로 유지됩니다.",
	bulkStopConfirmOk: "중지",
	bulkStopConfirmDeny: "계속",
	bulkIntro: (f) =>
		`미디어 라이브러리의 모든 JPEG / PNG를 ${f}(으)로 변환해 새 미디어로 저장합니다. 이미 변환된 이미지는 건너뛰고 실패한 이미지는 다시 시도합니다.`,
	bulkStart: (f) => `${f} 일괄 변환 시작`,
	bulkStartConfirmTitle: "일괄 변환을 시작할까요?",
	bulkStartConfirmText: (n) =>
		`한 번에 ${n}개씩 처리합니다. 원본은 유지되고 변환된 사본이 추가됩니다.`,
	bulkStartConfirmOk: "시작",
	cancel: "취소",

	settingsHeader: "설정",
	formatLabel: "출력 형식",
	formatWebp: "WebP — 거의 모든 브라우저에서 표시됩니다",
	formatAvif: "AVIF — 파일이 더 작지만 변환이 느립니다",
	autoConvertLabel: "업로드 시 자동 변환",
	autoConvertDescription: "JPEG / PNG를 업로드하면 변환된 사본을 새 미디어로 저장합니다.",
	qualityLabel: "품질 (1–100)",
	saveSettings: "설정 저장",
	settingsNote:
		"원본 이미지는 수정되거나 삭제되지 않습니다. 배치 크기와 인코더는 플러그인 설정에서 바꿀 수 있습니다.",
	advancedSettings: "고급 설정",

	historyHeader: "변환 기록",
	historyEmpty: "아직 변환된 이미지가 없습니다.",
	colSource: "원본",
	colConverted: "변환본",
	colStatus: "상태",
	colDetail: "세부 정보",
	colDate: "업데이트",
	status: { processing: "처리 중", converted: "변환됨", skipped: "건너뜀", failed: "실패" },
	reasonLarger: "변환본이 원본보다 큼",
	reasonTooLarge: "16MB 초과",

	toastSettingsSaved: "설정을 저장했습니다",
	toastBulkStarted: "일괄 변환을 시작했습니다",
	toastBulkDone: "일괄 변환이 완료되었습니다",
	toastBatchProcessed: "배치를 처리했습니다",
	toastBusy: "다른 배치가 처리 중입니다. 잠시 후 새로고침하세요.",
	toastBulkStopped: "일괄 변환을 중지했습니다",
};

const es: Messages = {
	title: "Optimizador de imágenes (WebP / AVIF)",
	statFormat: "Formato de salida",
	statAutoConvert: "Convertir al subir",
	statConverted: (f) => `Convertidas a ${f}`,
	statSkippedFailed: "Omitidas / con error",
	on: "Activado",
	off: "Desactivado",

	bulkHeader: "Convertir en lote las imágenes existentes",
	bulkStatus: { running: "en curso", done: "completada", cancelled: "detenida", idle: "inactiva" },
	bulkBannerTitle: (f, s) => `Conversión en lote (${f}): ${s}`,
	bulkBannerCounts: (c) =>
		`Revisadas ${c.scanned} · convertidas ${c.converted} · omitidas ${c.skipped} · ` +
		`con error ${c.failed} · ya convertidas ${c.existing}`,
	bulkCronHint:
		"Si el cron de plugins está activo en el servidor, el proceso avanza cada minuto en segundo plano. También puedes avanzarlo con «Ejecutar siguiente lote».",
	bulkRunNext: "Ejecutar siguiente lote",
	bulkRefresh: "Actualizar progreso",
	bulkStop: "Detener",
	bulkStopConfirmTitle: "¿Detener la conversión en lote?",
	bulkStopConfirmText: "Las imágenes ya convertidas se conservan.",
	bulkStopConfirmOk: "Detener",
	bulkStopConfirmDeny: "Continuar",
	bulkIntro: (f) =>
		`Convierte todos los JPEG / PNG de la biblioteca de medios a ${f} y guarda cada resultado como un medio nuevo. Las imágenes ya convertidas se omiten y las que fallaron se reintentan.`,
	bulkStart: (f) => `Empezar a convertir a ${f}`,
	bulkStartConfirmTitle: "¿Iniciar la conversión en lote?",
	bulkStartConfirmText: (n) =>
		`Se procesan ${n} imágenes cada vez. Los originales se conservan y se añaden las copias convertidas.`,
	bulkStartConfirmOk: "Iniciar",
	cancel: "Cancelar",

	settingsHeader: "Ajustes",
	formatLabel: "Formato de salida",
	formatWebp: "WebP — se muestra en prácticamente todos los navegadores",
	formatAvif: "AVIF — archivos más pequeños, pero la conversión es más lenta",
	autoConvertLabel: "Convertir al subir",
	autoConvertDescription:
		"Al subir un JPEG / PNG, se guarda una copia convertida como un medio nuevo.",
	qualityLabel: "Calidad (1–100)",
	saveSettings: "Guardar ajustes",
	settingsNote:
		"Las imágenes originales nunca se modifican ni se eliminan. El tamaño de lote y el codificador se cambian en los ajustes del plugin.",
	advancedSettings: "Ajustes avanzados",

	historyHeader: "Historial de conversiones",
	historyEmpty: "Todavía no se ha convertido ninguna imagen.",
	colSource: "Original",
	colConverted: "Convertida",
	colStatus: "Estado",
	colDetail: "Detalles",
	colDate: "Actualizada",
	status: { processing: "Procesando", converted: "Convertida", skipped: "Omitida", failed: "Error" },
	reasonLarger: "El resultado era más grande que el original",
	reasonTooLarge: "Mayor de 16 MB",

	toastSettingsSaved: "Ajustes guardados",
	toastBulkStarted: "Conversión en lote iniciada",
	toastBulkDone: "Conversión en lote completada",
	toastBatchProcessed: "Lote procesado",
	toastBusy: "Hay otro lote en curso. Actualiza en un momento.",
	toastBulkStopped: "Conversión en lote detenida",
};

const fr: Messages = {
	title: "Optimiseur d’images (WebP / AVIF)",
	statFormat: "Format de sortie",
	statAutoConvert: "Conversion au téléversement",
	statConverted: (f) => `Converties en ${f}`,
	statSkippedFailed: "Ignorées / en échec",
	on: "Activée",
	off: "Désactivée",

	bulkHeader: "Convertir en lot les images existantes",
	bulkStatus: { running: "en cours", done: "terminée", cancelled: "arrêtée", idle: "inactive" },
	bulkBannerTitle: (f, s) => `Conversion en lot (${f}) : ${s}`,
	bulkBannerCounts: (c) =>
		`Vérifiées ${c.scanned} · converties ${c.converted} · ignorées ${c.skipped} · ` +
		`en échec ${c.failed} · déjà converties ${c.existing}`,
	bulkCronHint:
		"Si le cron des plugins tourne sur le serveur, la tâche avance chaque minute en arrière-plan. Vous pouvez aussi la faire avancer avec « Lancer le lot suivant ».",
	bulkRunNext: "Lancer le lot suivant",
	bulkRefresh: "Actualiser la progression",
	bulkStop: "Arrêter",
	bulkStopConfirmTitle: "Arrêter la conversion en lot ?",
	bulkStopConfirmText: "Les images déjà converties sont conservées.",
	bulkStopConfirmOk: "Arrêter",
	bulkStopConfirmDeny: "Continuer",
	bulkIntro: (f) =>
		`Convertit tous les JPEG / PNG de la médiathèque en ${f} et enregistre chaque résultat comme un nouveau média. Les images déjà converties sont ignorées et celles en échec sont réessayées.`,
	bulkStart: (f) => `Lancer la conversion en ${f}`,
	bulkStartConfirmTitle: "Lancer la conversion en lot ?",
	bulkStartConfirmText: (n) =>
		`Les images sont traitées par ${n}. Les originaux sont conservés et les copies converties sont ajoutées.`,
	bulkStartConfirmOk: "Lancer",
	cancel: "Annuler",

	settingsHeader: "Réglages",
	formatLabel: "Format de sortie",
	formatWebp: "WebP — s’affiche dans pratiquement tous les navigateurs",
	formatAvif: "AVIF — fichiers plus légers, mais conversion plus lente",
	autoConvertLabel: "Convertir au téléversement",
	autoConvertDescription:
		"Lorsqu’un JPEG / PNG est téléversé, une copie convertie est enregistrée comme nouveau média.",
	qualityLabel: "Qualité (1–100)",
	saveSettings: "Enregistrer les réglages",
	settingsNote:
		"Les images originales ne sont jamais modifiées ni supprimées. La taille des lots et l’encodeur se règlent dans les réglages du plugin.",
	advancedSettings: "Réglages avancés",

	historyHeader: "Historique des conversions",
	historyEmpty: "Aucune image n’a encore été convertie.",
	colSource: "Original",
	colConverted: "Convertie",
	colStatus: "État",
	colDetail: "Détails",
	colDate: "Mise à jour",
	status: { processing: "En cours", converted: "Convertie", skipped: "Ignorée", failed: "Échec" },
	reasonLarger: "Le résultat était plus lourd que l’original",
	reasonTooLarge: "Plus de 16 Mo",

	toastSettingsSaved: "Réglages enregistrés",
	toastBulkStarted: "Conversion en lot lancée",
	toastBulkDone: "Conversion en lot terminée",
	toastBatchProcessed: "Lot traité",
	toastBusy: "Un autre lot est en cours. Actualisez dans un instant.",
	toastBulkStopped: "Conversion en lot arrêtée",
};

const de: Messages = {
	title: "Bildoptimierung (WebP / AVIF)",
	statFormat: "Ausgabeformat",
	statAutoConvert: "Beim Hochladen umwandeln",
	statConverted: (f) => `In ${f} umgewandelt`,
	statSkippedFailed: "Übersprungen / fehlgeschlagen",
	on: "An",
	off: "Aus",

	bulkHeader: "Vorhandene Bilder stapelweise umwandeln",
	bulkStatus: { running: "läuft", done: "abgeschlossen", cancelled: "gestoppt", idle: "inaktiv" },
	bulkBannerTitle: (f, s) => `Stapelumwandlung (${f}): ${s}`,
	bulkBannerCounts: (c) =>
		`Geprüft ${c.scanned} · umgewandelt ${c.converted} · übersprungen ${c.skipped} · ` +
		`fehlgeschlagen ${c.failed} · bereits umgewandelt ${c.existing}`,
	bulkCronHint:
		"Wenn auf dem Server der Plugin-Cron läuft, geht der Vorgang im Hintergrund jede Minute weiter. Mit „Nächsten Stapel ausführen“ geht es auch manuell weiter.",
	bulkRunNext: "Nächsten Stapel ausführen",
	bulkRefresh: "Fortschritt aktualisieren",
	bulkStop: "Stoppen",
	bulkStopConfirmTitle: "Stapelumwandlung stoppen?",
	bulkStopConfirmText: "Bereits umgewandelte Bilder bleiben erhalten.",
	bulkStopConfirmOk: "Stoppen",
	bulkStopConfirmDeny: "Weitermachen",
	bulkIntro: (f) =>
		`Wandelt alle JPEG- / PNG-Dateien der Mediathek in ${f} um und speichert jedes Ergebnis als neues Medium. Bereits umgewandelte Bilder werden übersprungen, fehlgeschlagene erneut versucht.`,
	bulkStart: (f) => `Umwandlung in ${f} starten`,
	bulkStartConfirmTitle: "Stapelumwandlung starten?",
	bulkStartConfirmText: (n) =>
		`Es werden jeweils ${n} Bilder verarbeitet. Die Originale bleiben erhalten, die umgewandelten Kopien kommen hinzu.`,
	bulkStartConfirmOk: "Starten",
	cancel: "Abbrechen",

	settingsHeader: "Einstellungen",
	formatLabel: "Ausgabeformat",
	formatWebp: "WebP — wird in praktisch jedem Browser angezeigt",
	formatAvif: "AVIF — kleinere Dateien, aber langsamere Umwandlung",
	autoConvertLabel: "Beim Hochladen umwandeln",
	autoConvertDescription:
		"Beim Hochladen einer JPEG- / PNG-Datei wird eine umgewandelte Kopie als neues Medium gespeichert.",
	qualityLabel: "Qualität (1–100)",
	saveSettings: "Einstellungen speichern",
	settingsNote:
		"Originalbilder werden nie verändert oder gelöscht. Stapelgröße und Encoder lassen sich in den Plugin-Einstellungen ändern.",
	advancedSettings: "Erweiterte Einstellungen",

	historyHeader: "Umwandlungsverlauf",
	historyEmpty: "Es wurden noch keine Bilder umgewandelt.",
	colSource: "Original",
	colConverted: "Umgewandelt",
	colStatus: "Status",
	colDetail: "Details",
	colDate: "Aktualisiert",
	status: {
		processing: "In Bearbeitung",
		converted: "Umgewandelt",
		skipped: "Übersprungen",
		failed: "Fehlgeschlagen",
	},
	reasonLarger: "Ergebnis war größer als das Original",
	reasonTooLarge: "Größer als 16 MB",

	toastSettingsSaved: "Einstellungen gespeichert",
	toastBulkStarted: "Stapelumwandlung gestartet",
	toastBulkDone: "Stapelumwandlung abgeschlossen",
	toastBatchProcessed: "Stapel verarbeitet",
	toastBusy: "Ein anderer Stapel läuft gerade. Bitte gleich aktualisieren.",
	toastBulkStopped: "Stapelumwandlung gestoppt",
};

const ptBR: Messages = {
	title: "Otimizador de imagens (WebP / AVIF)",
	statFormat: "Formato de saída",
	statAutoConvert: "Converter ao enviar",
	statConverted: (f) => `Convertidas para ${f}`,
	statSkippedFailed: "Ignoradas / com falha",
	on: "Ativado",
	off: "Desativado",

	bulkHeader: "Converter em lote as imagens existentes",
	bulkStatus: { running: "em andamento", done: "concluída", cancelled: "interrompida", idle: "ociosa" },
	bulkBannerTitle: (f, s) => `Conversão em lote (${f}): ${s}`,
	bulkBannerCounts: (c) =>
		`Verificadas ${c.scanned} · convertidas ${c.converted} · ignoradas ${c.skipped} · ` +
		`com falha ${c.failed} · já convertidas ${c.existing}`,
	bulkCronHint:
		"Se o cron de plugins estiver ativo no servidor, o processo avança a cada minuto em segundo plano. Você também pode avançá-lo com “Executar próximo lote”.",
	bulkRunNext: "Executar próximo lote",
	bulkRefresh: "Atualizar progresso",
	bulkStop: "Interromper",
	bulkStopConfirmTitle: "Interromper a conversão em lote?",
	bulkStopConfirmText: "As imagens já convertidas são mantidas.",
	bulkStopConfirmOk: "Interromper",
	bulkStopConfirmDeny: "Continuar",
	bulkIntro: (f) =>
		`Converte todos os JPEG / PNG da biblioteca de mídia para ${f} e salva cada resultado como uma nova mídia. Imagens já convertidas são ignoradas e as que falharam são tentadas novamente.`,
	bulkStart: (f) => `Começar a converter para ${f}`,
	bulkStartConfirmTitle: "Iniciar a conversão em lote?",
	bulkStartConfirmText: (n) =>
		`As imagens são processadas ${n} por vez. Os originais são mantidos e as cópias convertidas são adicionadas.`,
	bulkStartConfirmOk: "Iniciar",
	cancel: "Cancelar",

	settingsHeader: "Configurações",
	formatLabel: "Formato de saída",
	formatWebp: "WebP — exibido em praticamente todos os navegadores",
	formatAvif: "AVIF — arquivos menores, mas conversão mais lenta",
	autoConvertLabel: "Converter ao enviar",
	autoConvertDescription:
		"Ao enviar um JPEG / PNG, uma cópia convertida é salva como uma nova mídia.",
	qualityLabel: "Qualidade (1–100)",
	saveSettings: "Salvar configurações",
	settingsNote:
		"As imagens originais nunca são alteradas nem excluídas. O tamanho do lote e o codificador podem ser alterados nas configurações do plugin.",
	advancedSettings: "Configurações avançadas",

	historyHeader: "Histórico de conversões",
	historyEmpty: "Nenhuma imagem foi convertida ainda.",
	colSource: "Original",
	colConverted: "Convertida",
	colStatus: "Status",
	colDetail: "Detalhes",
	colDate: "Atualizada",
	status: { processing: "Processando", converted: "Convertida", skipped: "Ignorada", failed: "Falha" },
	reasonLarger: "O resultado ficou maior que o original",
	reasonTooLarge: "Maior que 16 MB",

	toastSettingsSaved: "Configurações salvas",
	toastBulkStarted: "Conversão em lote iniciada",
	toastBulkDone: "Conversão em lote concluída",
	toastBatchProcessed: "Lote processado",
	toastBusy: "Outro lote está em andamento. Atualize em instantes.",
	toastBulkStopped: "Conversão em lote interrompida",
};

const it: Messages = {
	title: "Ottimizzatore di immagini (WebP / AVIF)",
	statFormat: "Formato di output",
	statAutoConvert: "Conversione al caricamento",
	statConverted: (f) => `Convertite in ${f}`,
	statSkippedFailed: "Saltate / non riuscite",
	on: "Attiva",
	off: "Disattiva",

	bulkHeader: "Converti in blocco le immagini esistenti",
	bulkStatus: { running: "in corso", done: "completata", cancelled: "interrotta", idle: "inattiva" },
	bulkBannerTitle: (f, s) => `Conversione in blocco (${f}): ${s}`,
	bulkBannerCounts: (c) =>
		`Controllate ${c.scanned} · convertite ${c.converted} · saltate ${c.skipped} · ` +
		`non riuscite ${c.failed} · già convertite ${c.existing}`,
	bulkCronHint:
		"Se sul server è attivo il cron dei plugin, il processo avanza ogni minuto in background. Puoi anche farlo avanzare con «Esegui il prossimo blocco».",
	bulkRunNext: "Esegui il prossimo blocco",
	bulkRefresh: "Aggiorna avanzamento",
	bulkStop: "Interrompi",
	bulkStopConfirmTitle: "Interrompere la conversione in blocco?",
	bulkStopConfirmText: "Le immagini già convertite vengono mantenute.",
	bulkStopConfirmOk: "Interrompi",
	bulkStopConfirmDeny: "Continua",
	bulkIntro: (f) =>
		`Converte tutti i JPEG / PNG della libreria media in ${f} e salva ogni risultato come nuovo media. Le immagini già convertite vengono saltate e quelle non riuscite vengono ritentate.`,
	bulkStart: (f) => `Avvia la conversione in ${f}`,
	bulkStartConfirmTitle: "Avviare la conversione in blocco?",
	bulkStartConfirmText: (n) =>
		`Le immagini vengono elaborate ${n} alla volta. Gli originali vengono mantenuti e le copie convertite vengono aggiunte.`,
	bulkStartConfirmOk: "Avvia",
	cancel: "Annulla",

	settingsHeader: "Impostazioni",
	formatLabel: "Formato di output",
	formatWebp: "WebP — visualizzato praticamente da tutti i browser",
	formatAvif: "AVIF — file più piccoli, ma conversione più lenta",
	autoConvertLabel: "Converti al caricamento",
	autoConvertDescription:
		"Quando viene caricato un JPEG / PNG, una copia convertita viene salvata come nuovo media.",
	qualityLabel: "Qualità (1–100)",
	saveSettings: "Salva impostazioni",
	settingsNote:
		"Le immagini originali non vengono mai modificate né eliminate. La dimensione dei blocchi e l’encoder si cambiano nelle impostazioni del plugin.",
	advancedSettings: "Impostazioni avanzate",

	historyHeader: "Cronologia conversioni",
	historyEmpty: "Nessuna immagine è stata ancora convertita.",
	colSource: "Originale",
	colConverted: "Convertita",
	colStatus: "Stato",
	colDetail: "Dettagli",
	colDate: "Aggiornata",
	status: { processing: "In corso", converted: "Convertita", skipped: "Saltata", failed: "Non riuscita" },
	reasonLarger: "Il risultato era più grande dell’originale",
	reasonTooLarge: "Oltre 16 MB",

	toastSettingsSaved: "Impostazioni salvate",
	toastBulkStarted: "Conversione in blocco avviata",
	toastBulkDone: "Conversione in blocco completata",
	toastBatchProcessed: "Blocco elaborato",
	toastBusy: "È in corso un altro blocco. Aggiorna tra poco.",
	toastBulkStopped: "Conversione in blocco interrotta",
};

const CATALOG: Record<string, Messages> = {
	en,
	ja,
	"zh-cn": zhCN,
	"zh-tw": zhTW,
	ko,
	es,
	fr,
	de,
	"pt-br": ptBR,
	it,
};

/** Locale used when nothing matches. */
export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = ["en", "ja", "zh-CN", "zh-TW", "ko", "es", "fr", "de", "pt-BR", "it"];

/** Regional tags that should use a sibling catalog. */
const ALIASES: Record<string, string> = {
	zh: "zh-cn",
	"zh-hans": "zh-cn",
	"zh-sg": "zh-cn",
	"zh-hant": "zh-tw",
	"zh-hk": "zh-tw",
	"zh-mo": "zh-tw",
	pt: "pt-br",
	"pt-pt": "pt-br",
};

/** Map a BCP 47 tag to a catalog key, or null when unsupported. */
export function matchLocale(tag: string): string | null {
	const lower = tag.trim().toLowerCase().replace(/_/g, "-");
	if (!lower) return null;
	if (CATALOG[lower]) return lower;
	if (ALIASES[lower]) return ALIASES[lower];
	// zh-Hant-TW → zh-hant, en-GB → en, es-419 → es
	const parts = lower.split("-");
	for (let i = parts.length - 1; i > 0; i--) {
		const prefix = parts.slice(0, i).join("-");
		if (CATALOG[prefix]) return prefix;
		if (ALIASES[prefix]) return ALIASES[prefix];
	}
	return null;
}

const LOCALE_COOKIE_RE = /(?:^|;\s*)emdash-locale=([^;]+)/;

/**
 * Resolve the admin locale the same way the EmDash admin does:
 * host-attested UI locale, then the `emdash-locale` cookie, then
 * Accept-Language, then English.
 */
export function resolveLocale(source: { ui?: { locale?: string }; request?: Request }): string {
	const candidates: string[] = [];
	if (source.ui?.locale) candidates.push(source.ui.locale);
	const headers = source.request?.headers;
	if (headers) {
		const cookie = headers.get("cookie")?.match(LOCALE_COOKIE_RE)?.[1];
		if (cookie) candidates.push(decodeURIComponent(cookie));
		for (const entry of (headers.get("accept-language") ?? "").split(",")) {
			const tag = entry.split(";")[0];
			if (tag) candidates.push(tag);
		}
	}
	for (const candidate of candidates) {
		const matched = matchLocale(candidate);
		if (matched) return matched;
	}
	return DEFAULT_LOCALE;
}

export function getMessages(locale: string): Messages {
	return CATALOG[matchLocale(locale) ?? DEFAULT_LOCALE] ?? en;
}
