package ryuulogic.com.barber.servicio;

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
@Data
@ToString
@Entity
@Table(name = "servicio")
public class Servicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_servicio;
    @Column(nullable = false, length = 200)
    String descripcion;
    @Column(nullable = false)
    double costo;

    @OneToMany(mappedBy = "servicio", cascade = CascadeType.ALL)
    private List<Cita> cita = new ArrayList<Cita>();

}
