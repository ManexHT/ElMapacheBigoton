package ryuulogic.com.barber.barbero;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import ryuulogic.com.barber.cita.Cita;

import java.util.ArrayList;
import java.util.List;


@AllArgsConstructor
@NoArgsConstructor
@ToString
@Data
@Entity
@Table(name = "barbero")
public class Barbero {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_barbero;
    @Column(nullable = false, length = 100)
    String nombre;
    //
    @OneToMany(mappedBy = "barbero", cascade = CascadeType.ALL)
    private List<Cita> cita = new ArrayList<Cita>();

}
