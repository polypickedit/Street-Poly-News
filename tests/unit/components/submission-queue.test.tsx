import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { SubmissionQueue } from "@/components/admin/SubmissionQueue";

const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => mockUseQuery(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

describe("SubmissionQueue", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("shows a loader while submissions are loading", () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: true });

    const { container } = render(<SubmissionQueue />);

    expect(container.querySelector("svg[class*=\"animate-spin\"]")).toBeInTheDocument();
  });

  it("renders submissions and status badges", () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "sub-1",
          track_title: "Test Song",
          artist_id: "artist-1",
          slot_id: null,
          artist_name: "Tester",
          spotify_track_url: "https://youtu.be/test",
          release_date: new Date().toISOString(),
          genre: "hip hop",
          mood: "energetic",
          bpm: null,
          status: "approved",
          payment_status: "paid",
          notes_internal: null,
          feedback_artist: null,
          created_at: new Date().toISOString(),
          reviewed_at: null,
          artists: { name: "Tester", email: "test@example.com" },
          slots: { name: "Test Slot", price: 25 },
        },
      ],
      isLoading: false,
    });

    render(<SubmissionQueue />);

    expect(screen.getByText("Test Song")).toBeInTheDocument();
    expect(screen.getByText("PAID")).toBeInTheDocument();
    expect(screen.getByText("APPROVED")).toBeInTheDocument();
  });
});
