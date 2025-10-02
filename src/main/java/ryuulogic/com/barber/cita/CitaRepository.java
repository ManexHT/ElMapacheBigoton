package ryuulogic.com.barber.cita;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface CitaRepository extends CrudRepository<Cita, Long> {
}
