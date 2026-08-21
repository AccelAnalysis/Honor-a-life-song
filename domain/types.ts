export type EntityId = string;
export type ISODateTime = string;

export type OrganizationKind = "platform" | "facility" | "nonprofit" | "sponsor" | "community_partner";
export type PersonRole = "customer" | "family_collaborator" | "authorized_representative" | "facility_staff" | "creator" | "admin";

export interface Person { id: EntityId; displayName: string; }
export interface Organization { id: EntityId; name: string; kind: OrganizationKind; }
export interface Membership { id: EntityId; personId: EntityId; organizationId?: EntityId; role: PersonRole; }

export interface Inquiry { id: EntityId; createdAt: ISODateTime; kind: "individual" | "program"; }
export interface Order { id: EntityId; requestId: EntityId; status: string; purchaserId: EntityId; }

export interface ProgramTemplate { id: EntityId; name: string; version: number; }
export interface ProgramRun { id: EntityId; templateId: EntityId; organizationId: EntityId; status: string; startsOn?: string; endsOn?: string; }
export interface Participant { id: EntityId; programRunId: EntityId; personId: EntityId; participationStatus: string; }
export interface Touchpoint { id: EntityId; programRunId: EntityId; type: "group_story" | "individual_interview" | "family_interview" | "songwriting" | "rehearsal" | "concert" | "delivery"; startsAt?: ISODateTime; }
export interface Participation { id: EntityId; participantId: EntityId; touchpointId: EntityId; attendance: "planned" | "attended" | "declined" | "missed"; }

export interface StoryContribution { id: EntityId; subjectPersonId: EntityId; contributedByPersonId?: EntityId; type: "note" | "photo" | "audio" | "document" | "memory"; }
export interface CreativeWork { id: EntityId; kind: "individual_song" | "group_song" | "tribute" | "arrangement" | "performance_asset"; title?: string; status: string; }
export interface LyricVersion { id: EntityId; creativeWorkId: EntityId; version: number; createdAt: ISODateTime; }
export interface Approval { id: EntityId; creativeWorkId: EntityId; approvedByPersonId: EntityId; approvedAt: ISODateTime; scope: "lyrics" | "final_recording"; }

export interface MediaAsset { id: EntityId; ownerEntityId: EntityId; kind: "photo" | "audio" | "video" | "document"; storageKey: string; }
export interface AuditEvent { id: EntityId; actorPersonId?: EntityId; action: string; entityType: string; entityId: EntityId; occurredAt: ISODateTime; }
