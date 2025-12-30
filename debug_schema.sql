-- Diagnostic RPC to check column names
CREATE OR REPLACE FUNCTION debug_get_columns(p_table TEXT)
RETURNS TABLE(col_name TEXT) AS $$
BEGIN
    RETURN QUERY 
    SELECT column_name::TEXT 
    FROM information_schema.columns 
    WHERE table_name = p_table 
    AND table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
