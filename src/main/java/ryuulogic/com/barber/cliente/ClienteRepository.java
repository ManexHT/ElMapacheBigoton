package ryuulogic.com.barber.cliente;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface ClienteRepository extends CrudRepository<Cliente, Long> {
}
