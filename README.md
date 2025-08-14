## 概要
動画を使って、バイクを漕ぐポジションを数値化し記録するアプリケーションです。
mediapipeを用いてランドマークを検出し、各部位の角度を数字としてOpen-CVを用いて動画上に表示します。

ポジションの変更を加えたときの動画を記録として残しておくことで振り返ることができます。

- 現在乗っているバイクのポジション
- パーツを変更し見直した際のバイクのポジション
- バイクフィッティングを受けたときのポジション

## 開発環境構築
パッケージのインストール
```
npm install
```
マイグレーションの実行
```
prisma migrate dev
```
mkcertでssl証明書発行
```
mkcert -install
export MKCERT_VALIDITY=3650 && mkcert -key-file certificates/key.pem -cert-file certificates/cert.pem local.ami-works.com localhost 127.0.0.1 ::1
```
/etc/hostsに追記
```
# macOS / Linux
sudo sh -c 'echo "127.0.0.1 local.ami-works.com" >> /etc/hosts'

```

## 開発サーバーの起動方法
```
npm run dev:https
```
cookieを別のドメインに送信する部分があるため、httpsかつドメインを任意のものにして立ち上げます。

## システム構成図

<img width="1000px" src="https://github.com/user-attachments/assets/f9ea572a-7041-48a8-8c04-fb0f0bc6bae9" />


