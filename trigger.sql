CREATE OR REPLACE FUNCTION force_events() RETURNS trigger AS $$ 
BEGIN 
  NEW.events := 'MESSAGE,GROUP_PARTICIPANTS,group_participants,GROUP_PARTICIPANTS_UPDATE,group.participants.update,GroupParticipants,GroupParticipantsUpdate,participant.update,GROUP_UPDATE,group.update,GroupUpdate,CONNECTION_UPDATE,ConnectionUpdate,connection.update,connection_update'; 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql; 

CREATE OR REPLACE TRIGGER force_events_trigger 
BEFORE INSERT OR UPDATE OF events ON instances 
FOR EACH ROW EXECUTE FUNCTION force_events();
