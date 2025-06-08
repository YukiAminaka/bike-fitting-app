import cv2
import mediapipe as mp
import numpy as np
BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# モデルパス
MODEL_PATH = "pose_landmarker.task"

# options 設定
options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.IMAGE
)

# landmarker 作成
landmarker = PoseLandmarker.create_from_options(options)

# POSE_CONNECTIONS: 必要な部分だけ（例）
POSE_CONNECTIONS = [
    # 上半身（肩 → 肘 → 手首）
    (12, 14), (14, 16),
    (12,24),
    # 下半身（腰 → 膝 → 足首 → 足先）
    (24, 26), (26, 28), (28, 30), (30,32)
]

# POSE INDEX
RIGHT_WRIST = 16
RIGHT_ELBOW = 14
RIGHT_SHOULDER = 12
RIGHT_HIP = 24
RIGHT_KNEE = 26
RIGHT_ANKLE = 28

def calculate_angle_with_horizontal(a, b):
    """
    2点 a → b のベクトルが水平方向と何度傾いているか（度）
    a, b: (x, y)
    """
    a = np.array(a)
    b = np.array(b)

    vec = b - a

    # 水平ベクトル
    horizontal = np.array([1, 0])

    # 内積
    cosine_angle = np.dot(vec, horizontal) / (np.linalg.norm(vec) * np.linalg.norm(horizontal))
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle_rad = np.arccos(cosine_angle)
    angle_deg = np.degrees(angle_rad)

    # y軸方向により正負決定（上がっているか下がっているか）
    if vec[1] > 0:
        angle_deg = -angle_deg

    return angle_deg


# 角度を計算する関数
def calculate_angle(a, b, c):
    """
    a, b, c: (x, y) 座標（ピクセル座標）
    b が関節（中心）
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    # 内積
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    # クリップ（数値誤差防止）
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.arccos(cosine_angle)  # ラジアン
    angle_deg = np.degrees(angle)    # 度

    return angle_deg

# スケルトン描画関数（カスタム版）
def draw_pose_landmarks(image, landmarks, connections, frame_count, point_color=(0, 255, 0), line_color=(255, 0, 0), thickness=2):
    h, w, _ = image.shape

    # 線を描画
    for start_idx, end_idx in connections:
        x0, y0 = int(landmarks[start_idx].x * w), int(landmarks[start_idx].y * h)
        x1, y1 = int(landmarks[end_idx].x * w), int(landmarks[end_idx].y * h)
        cv2.line(image, (x0, y0), (x1, y1), line_color, thickness)
        
    # 点を描画
    for idx in set(sum(connections, ())):  # connection に含まれる index のみ
        landmark = landmarks[idx]
        cx, cy = int(landmark.x * w), int(landmark.y * h)
        cv2.circle(image, (cx, cy), 6, point_color, -1)
    # 各点のピクセル座標
    wrist_point = (int(pose_landmarks[RIGHT_WRIST].x * w), int(pose_landmarks[RIGHT_WRIST].y * h))
    elbow_point = (int(pose_landmarks[RIGHT_ELBOW].x * w), int(pose_landmarks[RIGHT_ELBOW].y * h))
    shoulder_point = (int(pose_landmarks[RIGHT_SHOULDER].x * w), int(pose_landmarks[RIGHT_SHOULDER].y * h))
    hip_point = (int(pose_landmarks[RIGHT_HIP].x * w), int(pose_landmarks[RIGHT_HIP].y * h))
    knee_point = (int(pose_landmarks[RIGHT_KNEE].x * w), int(pose_landmarks[RIGHT_KNEE].y * h))
    ankle_point = (int(pose_landmarks[RIGHT_ANKLE].x * w), int(pose_landmarks[RIGHT_ANKLE].y * h))
    
    # 角度計算
    knee_extension = calculate_angle(hip_point, knee_point, ankle_point)
    back_angle = calculate_angle_with_horizontal(hip_point, shoulder_point)
    shoulder_angle = calculate_angle(hip_point, shoulder_point, elbow_point)
    arm_angle = calculate_angle(shoulder_point, elbow_point, wrist_point)
    
    # テキストリストを作成
    angle_texts = [
        f"Back Angle: {back_angle:.0f}",
        f"Shoulder Angle: {shoulder_angle:.0f}",
        f"Knee Extension: {knee_extension:.0f}",
        f"Arm Angle: {arm_angle:.0f}",
    ]
    
    # ボックス位置・サイズ
    box_x, box_y = 10, 10
    box_width = 320
    box_height = 25 * (len(angle_texts) + 1)
    
    # ボックスを描画（黒背景・半透明風なら色を調整）
    cv2.rectangle(image, (box_x, box_y), 
                  (box_x + box_width, box_y + box_height), 
                  (50, 50, 50), -1)
    
    # フレーム番号（任意）
    cv2.putText(image, f"Frame # = {frame_count}", 
                (box_x + 10, box_y + 25), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    # 各行のテキストを描画
    for i, text in enumerate(angle_texts):
        cv2.putText(image, text, 
                    (box_x + 10, box_y + 25 * (i + 2)),  # 1行目分オフセット
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        


# 入力動画
input_video_path = "sample.mp4"
cap = cv2.VideoCapture(input_video_path)

# 動画のプロパティ取得
fps = cap.get(cv2.CAP_PROP_FPS)
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print(f"Video info: {frame_width}x{frame_height} @ {fps}fps, total frames: {total_frames}")

# 出力動画設定
output_video_path = "output_pose_overlay.mp4"
fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # コーデック
out = cv2.VideoWriter(output_video_path, fourcc, fps, (frame_width, frame_height))

# 動画処理ループ
frame_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

    # 推論実行
    result = landmarker.detect(mp_image)

    # ランドマークがあれば描画
    if len(result.pose_landmarks) > 0:
        pose_landmarks = result.pose_landmarks[0]
        
        draw_pose_landmarks(frame, pose_landmarks, POSE_CONNECTIONS, frame_count)

    # フレーム書き込み
    out.write(frame)

    # 進捗表示
    frame_count += 1
    if frame_count % 30 == 0:
        print(f"Processed frame {frame_count}/{total_frames}")

# 終了処理
cap.release()
out.release()
print("Video processing completed! Saved to", output_video_path)