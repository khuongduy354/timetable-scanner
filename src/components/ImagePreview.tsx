interface ImagePreviewProps {
  previewUrl: string;
  result: string;
}

export const ImagePreview = ({ previewUrl, result }: ImagePreviewProps) => {
  if (!previewUrl) return null;

  return (
    <div style={{ marginTop: "1rem" }}>
      <img
        src={previewUrl}
        alt="Preview"
        style={{ maxWidth: "100%", maxHeight: "300px" }}
      />
      <p>{result}</p>
    </div>
  );
};
