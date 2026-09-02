import {
  DomainDTO,
  RoadmapGraphData,
  DomainsResponse,
  RoadmapGraphResponse,
  VerifiedSkillProfileDTO,
} from '../types/roadmap';

export async function fetchDomains(): Promise<DomainDTO[]> {
  const res = await fetch('/api/roadmap/domains');
  if (!res.ok) {
    throw new Error(`Failed to fetch domains: HTTP ${res.status}`);
  }
  const json: DomainsResponse = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to retrieve domain list');
  }
  return json.data.domains;
}

export async function fetchRoadmapGraph(
  domainSlug: string,
  token?: string | null
): Promise<RoadmapGraphData> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use authenticated user roadmap state endpoint if authenticated
  const endpoint = token
    ? `/api/skills/roadmap/${encodeURIComponent(domainSlug)}`
    : `/api/roadmap/${encodeURIComponent(domainSlug)}`;

  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    // If authenticated route fails with 401, fallback to public endpoint
    if (token && res.status === 401) {
      return fetchRoadmapGraph(domainSlug, null);
    }
    throw new Error(`Failed to fetch roadmap for ${domainSlug}: HTTP ${res.status}`);
  }

  const json: RoadmapGraphResponse = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to retrieve roadmap graph');
  }
  return json.data;
}

export async function claimSkill(skillId: string, token: string): Promise<void> {
  const res = await fetch('/api/skills/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ skillId }),
  });

  if (!res.ok) {
    throw new Error(`Failed to claim skill: HTTP ${res.status}`);
  }
}

export async function fetchVerifiedProfile(token: string): Promise<VerifiedSkillProfileDTO> {
  const res = await fetch('/api/skills/verified-profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch verified skill profile: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Invalid profile response');
  }

  return json.data;
}
