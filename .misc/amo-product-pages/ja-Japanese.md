# LISTING FOR: Japanese


## Name
RSS Sage-Like


## Summary
高速で軽量なサイドバー型フィードリーダー。Atom、RSS、JSON、RDFフィードに対応し、UI を柔軟にカスタマイズでき、ブラウザーのブックマークおよび同期機能とシームレスに連携します。


## Description / About this extension – (_HTML w/ some Markdown_)
```markdown
Sage-Like は、シンプルなサイドバー型フィードリーダーです（Atom、RSS、JSON、RDF 対応）。Peter Andrews による Sage と Higmmer による Sage++ という先行アドオンにならい、軽量で高速であることを重視して作成しました。

◼ **機能**
&emsp;● サイドバーを基盤にした表示。
&emsp;● サイドバーおよびアドレスバーからのフィード検出。
&emsp;● YouTube、Reddit、DeviantArt、
&emsp;&emsp;Pinterest、Behance 上の「隠れた」RSS フィードをカスタム検出。
&emsp;● ブラウザー標準のブックマークと統合。
&emsp;● Firefox Sync 使用時、フィードはデバイス間で自動的に同期。
&emsp;● ツリー表示を完全にカスタマイズ可能。追加/編集/削除/コピー/貼り付け/ドラッグ&ドロップを
&emsp;&emsp;サイドバー内で直接実行。
&emsp;● フィードツリーに対する多様なフィルター機能（タイトル、URL、状態で絞り込み）。
&emsp;● フィードおよびフィード項目（記事）のコンテキストメニューで、より多くの操作が可能。
&emsp;● フィード項目リストで *middle-click*、*ctrl-click*、*shift-click* をサポート。
&emsp;● *middle-click* またはコンテキストメニューでレンダリング済みフィードプレビューを表示（カスタム
&emsp;&emsp;スタイルシートをサポート）。
&emsp;● OPML ファイルを使用したフィード購読のインポート/エクスポートをサポート。
&emsp;● UI のフォントと色をカスタマイズ可能。
&emsp;● Manifest V3 をサポート。

◼ **マニフェスト バージョン**
Sage-Like v3.2.2 は Manifest V2 をサポートする最後のバージョンです。拡張機能のバージョン履歴ページで入手できます: https://addons.mozilla.org/en-US/firefox/addon/sage-like/versions

◼ **権限が必要な理由**
&emsp;● 'ブックマークの読み取りと変更' – ブラウザー標準の
&emsp;&emsp;ブックマークとの統合。
&emsp;● 'クリップボードからのデータ取得' – サイドバー内でのコピー/貼り付け操作を
&emsp;&emsp;サポート。
&emsp;● 'クリップボードへのデータ入力' – サイドバー内でのコピー/貼り付け操作を
&emsp;&emsp;サポート。
&emsp;● 'ファイルのダウンロードおよびブラウザーのダウンロード履歴の読み取りと変更' –
&emsp;&emsp;フィードをファイル（OPML）へエクスポートするため。
&emsp;● 'ブラウジング履歴へアクセス' – フィード状態（既読/未読）の管理。
&emsp;● 'ブラウザーのタブへのアクセス' – フィード記事、フィードプレビューなどを開くため。
&emsp;● 'すべてのウェブサイトの保存されたデータへのアクセス' – フィード取得およびフィード検出のため。
&emsp;● "storage" – 拡張機能の設定を保存するため。
&emsp;● "webRequest" – RSS リンクのクリックをフックしてフィードプレビューを表示するため。
&emsp;● "webRequestBlocking" – RSS リンクのクリックをフックしてフィードプレビューを表示するため。
&emsp;● "menus" – コンテキストメニューからページリンクをフィードプレビューで開くため。
&emsp;● "contextualIdentities" – フィード記事およびフィードプレビューを
&emsp;&emsp;コンテナータブで開くため。
&emsp;● "cookies" – フィード記事およびフィードプレビューをコンテナータブで開くため。

◼ **カスタム CSS ファイル**
フィードプレビューページ用のカスタム CSS ファイル集を、すぐ使えるスタイルまたはカスタマイズ例として提供しています。Mozilla Discourse フォーラムで利用できます: https://discourse.mozilla.org/t/support-sage-like-sidebar-based-rss-feed-reader/43383/18

◼ **サポートとフィードバック**
サポート、トラブルシューティング、フィードバックについては、Mozilla Discourse フォーラムのサポートページをご覧ください: https://discourse.mozilla.org/t/support-sage-like-sidebar-based-rss-feed-reader/43383

◼ **Issue の送信**
不具合報告や機能要望は、GitHub リポジトリに issue を作成してください: https://github.com/arielgee/Sage-Like/issues。不具合報告時は、ブラウザーのバージョン、拡張機能のバージョン、再現手順の詳細を記載してください。
```


## Manage Version 3.14 ➜ Version Notes – (_HTML w/ some Markdown_)
```markdown
**変更点**

* カスタムスタイルをインラインで適用し、プレビュー文書内でコンテンツサポートを直接読み込むことで、Firefox の新しい挙動に対するフィードプレビュー互換性を改善。
* フィードプレビューのジャンプリストを、刷新したデザイン、より信頼性の高い開閉処理、安全性を高めた拡張サイズ調整で改善。
* ツリー表示から直接フィードを更新できる F5 キー対応を追加。
* インターフェース全体で右から左への表示（RTL）およびローカライズ対応を改善。
* よりクリーンなコントロールスタイル、より一貫したフラッシュタイミング、長いラベルへの対応改善により、設定 UI の一貫性を向上。
* HTML 文字列ユーティリティの更新と XML エンティティデコードにより、フィードテキスト処理とサニタイズを改善。
* 情報バブルの視覚表現と配置を改善。
* フィードプレビューのクリーンアップと SVG 処理を改善。
* ブラウザー互換性の基準を変更: この拡張機能は Firefox 140 以降が必要となり、140 未満の Firefox はサポート対象外になりました。
* 軽微なコード改善とスタイルシートのクリーンアップ。
```
