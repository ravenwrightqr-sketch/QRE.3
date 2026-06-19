type Props = {
  input: string;
  setInput: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
};

export default function FlowInputPanel({
  input,
  setInput,
  onGenerate,
  loading,
}: Props) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 10 }}>
      <h3>Write Flow Idea</h3>

      <textarea
        placeholder="beer cold → 3 sec → buy 1 get 1"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", height: 100 }}
      />

      <button onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Flow"}
      </button>
    </div>
  );
}